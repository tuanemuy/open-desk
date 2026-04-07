import type { WithEvents } from "@/core/domain/common/event";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { Record } from "@/core/domain/record/entity";
import type { RecordEvent } from "@/core/domain/record/events";
import type { ProcessExecutionService } from "@/core/domain/record/services/processExecutionService";

export class StubProcessExecutionService implements ProcessExecutionService {
  executeTransition(
    _record: Record,
    _action: string,
    _assignee?: UserId,
  ): Promise<WithEvents<Record, RecordEvent>> {
    throw new Error("Not implemented");
  }

  updateAssignees(
    _record: Record,
    _assignees: readonly UserId[],
  ): Promise<WithEvents<Record, RecordEvent>> {
    throw new Error("Not implemented");
  }
}
