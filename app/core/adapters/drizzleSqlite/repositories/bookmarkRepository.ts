import type { InferSelectModel } from "drizzle-orm";
import { and, asc, eq } from "drizzle-orm";
import { bookmarks } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Bookmark } from "@/core/domain/bookmark/entity";
import type {
  BookmarkGroupedByCategory,
  BookmarkRepository,
} from "@/core/domain/bookmark/ports/bookmarkRepository";
import type {
  AppId as AppIdType,
  BookmarkCategory,
  BookmarkId as BookmarkIdType,
  BookmarkName as BookmarkNameType,
  BookmarkUrl as BookmarkUrlType,
} from "@/core/domain/bookmark/valueObject";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type BookmarkDataModel = InferSelectModel<typeof bookmarks>;

export class DrizzleSqliteBookmarkRepository implements BookmarkRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: BookmarkDataModel): Bookmark {
    return {
      bookmarkId: data.id as BookmarkIdType,
      userId: data.userId as UserIdType,
      name: data.name as BookmarkNameType,
      url: data.url as BookmarkUrlType,
      category: data.category as BookmarkCategory,
      appId: data.appId !== null ? (data.appId as AppIdType) : null,
      createdAt: data.createdAt,
    };
  }

  async findById(bookmarkId: BookmarkIdType): Promise<Bookmark | null> {
    try {
      const results = await this.executor
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.id, bookmarkId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find bookmark by id",
        error,
      );
    }
  }

  async findByUserId(userId: UserIdType): Promise<Bookmark[]> {
    try {
      const results = await this.executor
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId))
        .orderBy(asc(bookmarks.createdAt));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find bookmarks by user id",
        error,
      );
    }
  }

  async findByCategory(
    userId: UserIdType,
    category: BookmarkCategory,
  ): Promise<Bookmark[]> {
    try {
      const results = await this.executor
        .select()
        .from(bookmarks)
        .where(
          and(eq(bookmarks.userId, userId), eq(bookmarks.category, category)),
        )
        .orderBy(asc(bookmarks.createdAt));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find bookmarks by category",
        error,
      );
    }
  }

  async findAllGroupedByCategory(
    userId: UserIdType,
  ): Promise<BookmarkGroupedByCategory> {
    try {
      const results = await this.executor
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId))
        .orderBy(asc(bookmarks.createdAt));

      const all = results.map((r) => this.into(r));

      return {
        app: all.filter((b) => b.category === "APP"),
        search: all.filter((b) => b.category === "SEARCH"),
        other: all.filter((b) => b.category === "OTHER"),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find bookmarks grouped by category",
        error,
      );
    }
  }

  async save(bookmark: Bookmark): Promise<void> {
    try {
      await this.executor
        .insert(bookmarks)
        .values({
          id: bookmark.bookmarkId,
          userId: bookmark.userId,
          name: bookmark.name,
          url: bookmark.url,
          category: bookmark.category,
          appId: bookmark.appId,
          createdAt: bookmark.createdAt,
        })
        .onConflictDoUpdate({
          target: bookmarks.id,
          set: {
            name: bookmark.name,
            url: bookmark.url,
            category: bookmark.category,
            appId: bookmark.appId,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save bookmark",
        error,
      );
    }
  }

  async delete(bookmarkId: BookmarkIdType): Promise<void> {
    try {
      await this.executor.delete(bookmarks).where(eq(bookmarks.id, bookmarkId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete bookmark",
        error,
      );
    }
  }
}
