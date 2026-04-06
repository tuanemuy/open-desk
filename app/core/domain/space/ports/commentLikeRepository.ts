import type { UserId } from "@/core/domain/identity/valueObject";
import type { CommentLike } from "@/core/domain/space/entity";
import type { ThreadCommentId } from "@/core/domain/space/valueObject";

export interface CommentLikeRepository {
  findByCommentId(commentId: ThreadCommentId): Promise<CommentLike[]>;
  exists(commentId: ThreadCommentId, userId: UserId): Promise<boolean>;
  save(like: CommentLike): Promise<void>;
  delete(commentId: ThreadCommentId, userId: UserId): Promise<void>;
  deleteByCommentId(commentId: ThreadCommentId): Promise<void>;
}
