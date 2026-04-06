import type { Thread } from "@/core/domain/space/entity";
import type { SpaceId, ThreadId } from "@/core/domain/space/valueObject";

export interface ThreadRepository {
  findById(threadId: ThreadId): Promise<Thread | null>;
  findBySpaceId(spaceId: SpaceId): Promise<Thread[]>;
  findDefaultBySpaceId(spaceId: SpaceId): Promise<Thread | null>;
  save(thread: Thread): Promise<void>;
  delete(threadId: ThreadId): Promise<void>;
  countBySpaceId(spaceId: SpaceId): Promise<number>;
}
