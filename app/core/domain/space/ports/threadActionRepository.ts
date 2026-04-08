import type { ThreadAction } from "../entity";
import type { ThreadActionId } from "../valueObject";

export interface ThreadActionRepository {
  findById(threadActionId: ThreadActionId): Promise<ThreadAction | null>;
  list(
    offset: number,
    limit: number,
  ): Promise<{ actions: ThreadAction[]; totalCount: number }>;
  save(action: ThreadAction): Promise<void>;
  delete(threadActionId: ThreadActionId): Promise<void>;
}
