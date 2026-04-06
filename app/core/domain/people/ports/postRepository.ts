import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Post } from "@/core/domain/people/entity";
import type { PostId as PostIdType } from "@/core/domain/people/valueObject";

/**
 * Filter parameters for listing posts by author.
 */
export type PostListParams = {
  readonly authorId: UserIdType;
  readonly offset: number;
  readonly limit: number;
};

/**
 * Paginated post listing result.
 */
export type PostListResult = {
  readonly posts: readonly Post[];
  readonly totalCount: number;
};

/**
 * Repository port for Post entity persistence.
 */
export interface PostRepository {
  /**
   * Find a post by its ID.
   * @returns The post, or null if not found.
   */
  findById(postId: PostIdType): Promise<Post | null>;

  /**
   * Find posts by author with pagination (newest first).
   */
  findByAuthorId(params: PostListParams): Promise<PostListResult>;

  /**
   * Save a post (insert only; posts are immutable after creation).
   */
  save(post: Post): Promise<void>;

  /**
   * Delete a post by its ID.
   */
  delete(postId: PostIdType): Promise<void>;
}
