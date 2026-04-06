import type { Bookmark } from "@/core/domain/bookmark/entity";
import type {
  BookmarkCategory,
  BookmarkId as BookmarkIdType,
} from "@/core/domain/bookmark/valueObject";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";

/**
 * Category-grouped bookmark listing result.
 * Used for the bookmark panel initial display.
 */
export type BookmarkGroupedByCategory = {
  readonly app: readonly Bookmark[];
  readonly search: readonly Bookmark[];
  readonly other: readonly Bookmark[];
};

/**
 * Repository port for Bookmark entity persistence.
 */
export interface BookmarkRepository {
  /**
   * Find a bookmark by its unique identifier.
   * @returns The bookmark, or null if not found.
   */
  findById(bookmarkId: BookmarkIdType): Promise<Bookmark | null>;

  /**
   * Find all bookmarks for the specified user, ordered by createdAt ascending.
   */
  findByUserId(userId: UserIdType): Promise<Bookmark[]>;

  /**
   * Find bookmarks for the specified user filtered by category, ordered by createdAt ascending.
   */
  findByCategory(
    userId: UserIdType,
    category: BookmarkCategory,
  ): Promise<Bookmark[]>;

  /**
   * Find all bookmarks for the specified user grouped by the three categories.
   * Each array is ordered by createdAt ascending.
   */
  findAllGroupedByCategory(
    userId: UserIdType,
  ): Promise<BookmarkGroupedByCategory>;

  /**
   * Save a bookmark (insert or update).
   */
  save(bookmark: Bookmark): Promise<void>;

  /**
   * Delete a bookmark by its unique identifier.
   */
  delete(bookmarkId: BookmarkIdType): Promise<void>;
}
