import type { ThreadComment } from "@/core/domain/space/entity";
import type {
  ThreadCommentId,
  ThreadId,
} from "@/core/domain/space/valueObject";

export interface ThreadCommentRepository {
  findById(commentId: ThreadCommentId): Promise<ThreadComment | null>;
  findByThreadId(
    threadId: ThreadId,
    offset: number,
    limit: number,
  ): Promise<{ comments: ThreadComment[]; totalCount: number }>;
  save(comment: ThreadComment): Promise<void>;
  delete(commentId: ThreadCommentId): Promise<void>;
  deleteByThreadId(threadId: ThreadId): Promise<void>;
}
