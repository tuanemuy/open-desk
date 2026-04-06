import type { WithEvents } from "@/core/domain/common/event";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { Record } from "@/core/domain/record/entity";
import type { RecordEvent } from "@/core/domain/record/events";

/**
 * Domain service port for executing process management status transitions.
 *
 * Status transition rules are defined in the App domain.
 * This service executes transitions against records.
 */
export interface ProcessExecutionService {
  /**
   * Execute a status transition on a record.
   * - Determines the target status based on the action name
   * - Requires an assignee if the target status demands worker selection
   * - Increments the revision by 2 (action execution + status change)
   *
   * @param record - The target record
   * @param action - Name of the action to execute
   * @param assignee - Next assignee's user ID (required if the target status demands it)
   * @returns Updated record with events
   * @throws BusinessRuleError with InvalidStatusTransition if the action cannot be executed from the current status
   * @throws BusinessRuleError with AssigneeRequired if an assignee is needed but not provided
   * @throws BusinessRuleError with DuplicateAction if multiple actions share the same name
   */
  executeTransition(
    record: Record,
    action: string,
    assignee?: UserId,
  ): Promise<WithEvents<Record, RecordEvent>>;

  /**
   * Update the assignees for a record's current process status.
   * Only available for apps with process management enabled.
   *
   * @param record - The target record
   * @param assignees - New assignee list (empty array to clear assignees)
   * @returns Updated record with events
   * @throws BusinessRuleError with TooManyAssignees if more than 100 assignees
   * @throws BusinessRuleError with ProcessNotEnabled if process management is not enabled
   */
  updateAssignees(
    record: Record,
    assignees: readonly UserId[],
  ): Promise<WithEvents<Record, RecordEvent>>;
}
