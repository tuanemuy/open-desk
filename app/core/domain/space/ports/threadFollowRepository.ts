import type { UserId } from "@/core/domain/identity/valueObject";
import type { ThreadFollow } from "@/core/domain/space/entity";
import type { ThreadId } from "@/core/domain/space/valueObject";

export interface ThreadFollowRepository {
  exists(threadId: ThreadId, userId: UserId): Promise<boolean>;
  findByThreadId(threadId: ThreadId): Promise<ThreadFollow[]>;
  findByUserId(userId: UserId): Promise<ThreadFollow[]>;
  save(follow: ThreadFollow): Promise<void>;
  delete(threadId: ThreadId, userId: UserId): Promise<void>;
  deleteByThreadId(threadId: ThreadId): Promise<void>;
}
