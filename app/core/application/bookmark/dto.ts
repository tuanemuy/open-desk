import type {
  AppId,
  BookmarkCategory,
  BookmarkId,
} from "@/core/domain/bookmark/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";

export type BookmarkOutput = {
  bookmarkId: BookmarkId;
  userId: UserId;
  name: string;
  url: string;
  category: BookmarkCategory;
  appId: AppId | null;
  createdAt: Date;
};

export type BookmarkAppItem = {
  bookmarkId: BookmarkId;
  name: string;
  url: string;
  appId: AppId;
  createdAt: Date;
};

export type BookmarkOtherItem = {
  bookmarkId: BookmarkId;
  name: string;
  url: string;
  createdAt: Date;
};

export type BookmarkListByCategoryOutput = {
  app: BookmarkAppItem[];
  search: BookmarkOtherItem[];
  other: BookmarkOtherItem[];
};

export type DeleteBookmarkOutput = {
  bookmarkId: BookmarkId;
};
