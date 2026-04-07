import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import {
  processDefinitions,
  processStatuses,
  processTransitions,
} from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { ProcessDefinition } from "@/core/domain/app/entity";
import type { ProcessDefinitionRepository } from "@/core/domain/app/ports/processDefinitionRepository";
import type {
  AppId as AppIdType,
  ProcessStatusId as ProcessStatusIdType,
  ProcessStatus as ProcessStatusType,
  ProcessTransitionId as ProcessTransitionIdType,
  ProcessTransition as ProcessTransitionType,
  Revision as RevisionType,
  WorkerAssignment as WorkerAssignmentType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type ProcessStatusDataModel = InferSelectModel<typeof processStatuses>;
type ProcessTransitionDataModel = InferSelectModel<typeof processTransitions>;

export class DrizzleSqliteProcessDefinitionRepository
  implements ProcessDefinitionRepository
{
  constructor(private readonly executor: Executor) {}

  private intoStatus(data: ProcessStatusDataModel): ProcessStatusType {
    return {
      statusId: data.id as ProcessStatusIdType,
      name: data.name,
      index: data.orderIndex,
    };
  }

  private intoTransition(
    data: ProcessTransitionDataModel,
  ): ProcessTransitionType {
    const assignees =
      data.assignees as unknown as readonly WorkerAssignmentType[];

    // The condition column stores a JSON-encoded object with filterCondition and filterConditionType
    // or a plain string filter condition
    let filterCondition: string | null = null;
    let filterConditionType: "AND" | "OR" | null = null;

    if (data.condition !== null) {
      try {
        const parsed = JSON.parse(data.condition) as {
          filterCondition: string | null;
          filterConditionType: "AND" | "OR" | null;
        };
        filterCondition = parsed.filterCondition ?? null;
        filterConditionType = parsed.filterConditionType ?? null;
      } catch {
        // If it's not valid JSON, treat it as a plain filter condition string
        filterCondition = data.condition;
      }
    }

    return {
      transitionId: data.id as ProcessTransitionIdType,
      fromStatusId: data.fromStatusId as ProcessStatusIdType,
      actionName: data.actionName,
      toStatusId: data.toStatusId as ProcessStatusIdType,
      workers: assignees,
      filterCondition,
      filterConditionType,
    };
  }

  async findByAppId(appId: AppIdType): Promise<ProcessDefinition | null> {
    try {
      const defResults = await this.executor
        .select()
        .from(processDefinitions)
        .where(eq(processDefinitions.appId, appId))
        .limit(1);

      if (defResults.length === 0) {
        return null;
      }

      const defData = defResults[0];

      const [statusResults, transitionResults] = await Promise.all([
        this.executor
          .select()
          .from(processStatuses)
          .where(eq(processStatuses.processDefinitionId, defData.id)),
        this.executor
          .select()
          .from(processTransitions)
          .where(eq(processTransitions.processDefinitionId, defData.id)),
      ]);

      const statuses = statusResults
        .map((s) => this.intoStatus(s))
        .sort((a, b) => a.index - b.index);

      const transitions = transitionResults.map((t) => this.intoTransition(t));

      return {
        appId: defData.appId as AppIdType,
        isEnabled: defData.isEnabled,
        statuses,
        transitions,
        revision: defData.revision as RevisionType,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find process definition by app id",
        error,
      );
    }
  }

  async save(definition: ProcessDefinition): Promise<void> {
    try {
      // Upsert the process definition
      await this.executor
        .insert(processDefinitions)
        .values({
          appId: definition.appId,
          isEnabled: definition.isEnabled,
          revision: definition.revision,
        })
        .onConflictDoUpdate({
          target: processDefinitions.appId,
          set: {
            isEnabled: definition.isEnabled,
            revision: definition.revision,
          },
        });

      // Get the process definition ID
      const defResults = await this.executor
        .select({ id: processDefinitions.id })
        .from(processDefinitions)
        .where(eq(processDefinitions.appId, definition.appId))
        .limit(1);

      const defId = defResults[0].id;

      // Delete existing statuses and transitions, then re-insert
      await this.executor
        .delete(processTransitions)
        .where(eq(processTransitions.processDefinitionId, defId));
      await this.executor
        .delete(processStatuses)
        .where(eq(processStatuses.processDefinitionId, defId));

      // Insert statuses
      for (const status of definition.statuses) {
        await this.executor.insert(processStatuses).values({
          id: status.statusId,
          processDefinitionId: defId,
          name: status.name,
          orderIndex: status.index,
        });
      }

      // Insert transitions
      for (const transition of definition.transitions) {
        const conditionValue =
          transition.filterCondition !== null ||
          transition.filterConditionType !== null
            ? JSON.stringify({
                filterCondition: transition.filterCondition,
                filterConditionType: transition.filterConditionType,
              })
            : null;

        await this.executor.insert(processTransitions).values({
          id: transition.transitionId,
          processDefinitionId: defId,
          fromStatusId: transition.fromStatusId,
          actionName: transition.actionName,
          toStatusId: transition.toStatusId,
          assignees: transition.workers as unknown as Record<string, unknown>[],
          condition: conditionValue,
        });
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save process definition",
        error,
      );
    }
  }
}
