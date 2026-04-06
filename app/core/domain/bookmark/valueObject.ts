import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { BookmarkErrorCode } from "./errorCode";

// ============================================
// BookmarkId
// ============================================

type _BookmarkId = string & { readonly brand: "BookmarkId" };

export type BookmarkId = _BookmarkId;

export const BookmarkId = {
  create: (id: string): _BookmarkId => {
    return id as _BookmarkId;
  },
  generate: (): _BookmarkId => {
    return uuidv7() as _BookmarkId;
  },
};

// ============================================
// AppId (Bookmark-local definition to avoid circular dependency with App domain)
// ============================================

type _AppId = string & { readonly brand: "AppId" };

export type AppId = _AppId;

export const AppId = {
  create: (id: string): _AppId => {
    return id as _AppId;
  },
  generate: (): _AppId => {
    return uuidv7() as _AppId;
  },
};

// ============================================
// BookmarkCategory
// ============================================

export type BookmarkCategory = "APP" | "SEARCH" | "OTHER";

// ============================================
// BookmarkName
// ============================================

type _BookmarkName = string & { readonly brand: "BookmarkName" };

export type BookmarkName = _BookmarkName;

export const BookmarkName = {
  create: (name: string): _BookmarkName => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        BookmarkErrorCode.EmptyBookmarkName,
        "Bookmark name cannot be empty",
      );
    }
    return name as _BookmarkName;
  },
};

// ============================================
// BookmarkUrl
// ============================================

type _BookmarkUrl = string & { readonly brand: "BookmarkUrl" };

export type BookmarkUrl = _BookmarkUrl;

export const BookmarkUrl = {
  create: (url: string): _BookmarkUrl => {
    if (url.length === 0) {
      throw new BusinessRuleError(
        BookmarkErrorCode.EmptyBookmarkUrl,
        "Bookmark URL cannot be empty",
      );
    }
    return url as _BookmarkUrl;
  },
};
