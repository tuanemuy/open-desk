import { eq } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { ProcessDefinition } from "@/core/domain/app/entity";
import type {
  AppId as AppIdType,
  ProcessStatusId as ProcessStatusIdType,
  ProcessTransition as ProcessTransitionType,
  Revision as RevisionType,
  WorkerAssignment as WorkerAssignmentType,
} from "@/core/domain/app/valueObject";
import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record } from "@/core/domain/record/entity";
import { RecordErrorCode } from "@/core/domain/record/errorCode";
import type { RecordEvent } from "@/core/domain/record/events";
import type { ProcessExecutionService } from "@/core/domain/record/services/processExecutionService";
import { ProcessStatus } from "@/core/domain/record/valueObject";
import type { Database } from "../client";
import {
  processDefinitions,
  processStatuses,
  processTransitions,
} from "../schema";

/**
 * Drizzle SQLite implementation of ProcessExecutionService.
 *
 * Executes process management status transitions by looking up
 * process definitions from the database and applying transition rules.
 */
export class DrizzleSqliteProcessExecutionService
  implements ProcessExecutionService
{
  constructor(private readonly db: Database) {}

  async executeTransition(
    record: Record,
    action: string,
    assignee?: UserId,
  ): Promise<WithEvents<Record, RecordEvent>> {
    const definition = await this.fetchProcessDefinition(record.appId);

    if (!definition.isEnabled) {
      throw new BusinessRuleError(
        RecordErrorCode.ProcessNotEnabled,
        "Process management is not enabled for this app",
      );
    }

    // Find the current status in the definition
    const currentStatusName = record.status;
    if (currentStatusName === null) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidStatusTransition,
        "Record does not have a process status",
      );
    }

    const currentStatus = definition.statuses.find(
      (s) => s.name === currentStatusName,
    );
    if (!currentStatus) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidStatusTransition,
        `Current status "${currentStatusName}" not found in process definition`,
      );
    }

    // Find transitions that match the action name from the current status
    const matchingTransitions = definition.transitions.filter(
      (t) =>
        t.fromStatusId === currentStatus.statusId && t.actionName === action,
    );

    if (matchingTransitions.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidStatusTransition,
        `Action "${action}" is not valid for status "${currentStatusName}"`,
      );
    }

    if (matchingTransitions.length > 1) {
      throw new BusinessRuleError(
        RecordErrorCode.DuplicateAction,
        `Multiple transitions share the action name "${action}" from status "${currentStatusName}"`,
      );
    }

    const transition = matchingTransitions[0];

    // Find the target status
    const targetStatus = definition.statuses.find(
      (s) => s.statusId === transition.toStatusId,
    );
    if (!targetStatus) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidStatusTransition,
        `Target status for action "${action}" not found in process definition`,
      );
    }

    // Determine if the target status demands worker selection.
    // Check transitions FROM the target status to see if any have workers defined.
    const transitionsFromTarget = definition.transitions.filter(
      (t) => t.fromStatusId === targetStatus.statusId,
    );
    const targetRequiresWorker = transitionsFromTarget.some(
      (t) => t.workers.length > 0,
    );

    // Build the assignees list
    const assignees: readonly UserId[] =
      assignee !== undefined ? [assignee] : [];

    if (targetRequiresWorker && assignees.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.AssigneeRequired,
        `Target status "${targetStatus.name}" requires an assignee`,
      );
    }

    // Delegate to the Record entity's changeStatus method
    // which handles revision increment by 2 and event generation
    const newStatus = ProcessStatus.create(targetStatus.name);
    return Record.changeStatus(record, newStatus, assignees);
  }

  async updateAssignees(
    record: Record,
    assignees: readonly UserId[],
  ): Promise<WithEvents<Record, RecordEvent>> {
    const definition = await this.fetchProcessDefinition(record.appId);

    if (!definition.isEnabled) {
      throw new BusinessRuleError(
        RecordErrorCode.ProcessNotEnabled,
        "Process management is not enabled for this app",
      );
    }

    // Delegate to the Record entity's updateAssignees method
    // which handles the TooManyAssignees validation (max 100)
    return Record.updateAssignees(record, assignees);
  }

  /**
   * Fetch the process definition for an app from the database.
   */
  private async fetchProcessDefinition(
    appId: AppIdType,
  ): Promise<ProcessDefinition> {
    try {
      const defResults = await this.db
        .select()
        .from(processDefinitions)
        .where(eq(processDefinitions.appId, appId))
        .limit(1);

      if (defResults.length === 0) {
        throw new BusinessRuleError(
          RecordErrorCode.ProcessNotEnabled,
          "No process definition found for this app",
        );
      }

      const defData = defResults[0];

      const [statusResults, transitionResults] = await Promise.all([
        this.db
          .select()
          .from(processStatuses)
          .where(eq(processStatuses.processDefinitionId, defData.id)),
        this.db
          .select()
          .from(processTransitions)
          .where(eq(processTransitions.processDefinitionId, defData.id)),
      ]);

      const statuses = statusResults
        .map((s) => ({
          statusId: s.id as ProcessStatusIdType,
          name: s.name,
          index: s.orderIndex,
        }))
        .sort((a, b) => a.index - b.index);

      const transitions: ProcessTransitionType[] = transitionResults.map(
        (t) => {
          const workers =
            t.assignees as unknown as readonly WorkerAssignmentType[];

          let filterCondition: string | null = null;
          let filterConditionType: "AND" | "OR" | null = null;

          if (t.condition !== null) {
            try {
              const parsed = JSON.parse(t.condition) as {
                filterCondition: string | null;
                filterConditionType: "AND" | "OR" | null;
              };
              filterCondition = parsed.filterCondition ?? null;
              filterConditionType = parsed.filterConditionType ?? null;
            } catch {
              filterCondition = t.condition;
            }
          }

          return {
            transitionId:
              t.id as unknown as ProcessTransitionType["transitionId"],
            fromStatusId: t.fromStatusId as ProcessStatusIdType,
            actionName: t.actionName,
            toStatusId: t.toStatusId as ProcessStatusIdType,
            workers,
            filterCondition,
            filterConditionType,
          };
        },
      );

      return {
        appId: defData.appId as AppIdType,
        isEnabled: defData.isEnabled,
        statuses,
        transitions,
        revision: defData.revision as RevisionType,
      };
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch process definition",
        error,
      );
    }
  }
}
