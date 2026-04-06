import type { WithEvents } from "@/core/domain/common/event";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { BookmarkEvent } from "./events";
import { BookmarkEvents } from "./events";
import { BookmarkCategorizationService } from "./services/bookmarkCategorizationService";
import type {
  AppId as AppIdType,
  BookmarkCategory,
  BookmarkId as BookmarkIdType,
  BookmarkName as BookmarkNameType,
  BookmarkUrl as BookmarkUrlType,
} from "./valueObject";
import { BookmarkId, BookmarkName, BookmarkUrl } from "./valueObject";

// ============================================
// Bookmark Entity
// ============================================

type _Bookmark = Readonly<{
  bookmarkId: BookmarkIdType;
  userId: UserIdType;
  name: BookmarkNameType;
  url: BookmarkUrlType;
  category: BookmarkCategory;
  appId: AppIdType | null;
  createdAt: Date;
}>;

export type Bookmark = _Bookmark;

export const Bookmark = {
  /**
   * Create a new Bookmark entity.
   * Category and appId are automatically determined from the URL pattern.
   */
  create: (params: {
    userId: UserIdType;
    name: string;
    url: string;
  }): WithEvents<_Bookmark, BookmarkEvent> => {
    const name = BookmarkName.create(params.name);
    const url = BookmarkUrl.create(params.url);
    const { category, appId } = BookmarkCategorizationService.categorize(
      params.url,
    );

    const bookmark: _Bookmark = {
      bookmarkId: BookmarkId.generate(),
      userId: params.userId,
      name,
      url,
      category,
      appId,
      createdAt: new Date(),
    };

    return {
      entity: bookmark,
      events: [BookmarkEvents.created(bookmark.bookmarkId, bookmark.userId)],
    };
  },

  /**
   * Reconstruct a Bookmark entity from persisted data.
   */
  reconstruct: (data: _Bookmark): _Bookmark => data,

  /**
   * Update the bookmark name.
   * @throws BusinessRuleError if name is empty (EmptyBookmarkName)
   */
  updateName: (
    bookmark: _Bookmark,
    name: string,
  ): WithEvents<_Bookmark, BookmarkEvent> => {
    return {
      entity: {
        ...bookmark,
        name: BookmarkName.create(name),
      },
      events: [BookmarkEvents.updated(bookmark.bookmarkId)],
    };
  },

  /**
   * Update the bookmark URL.
   * Category and appId are automatically re-determined from the new URL pattern.
   * @throws BusinessRuleError if url is empty (EmptyBookmarkUrl)
   */
  updateUrl: (
    bookmark: _Bookmark,
    url: string,
  ): WithEvents<_Bookmark, BookmarkEvent> => {
    const newUrl = BookmarkUrl.create(url);
    const { category, appId } = BookmarkCategorizationService.categorize(url);

    return {
      entity: {
        ...bookmark,
        url: newUrl,
        category,
        appId,
      },
      events: [BookmarkEvents.updated(bookmark.bookmarkId)],
    };
  },

  /**
   * Check whether the specified user is the owner of this bookmark.
   */
  isOwnedBy: (bookmark: _Bookmark, userId: UserIdType): boolean => {
    return bookmark.userId === userId;
  },
};
