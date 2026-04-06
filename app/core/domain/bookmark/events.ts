import type { DomainEventBase } from "@/core/domain/common/event";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { BookmarkId as BookmarkIdType } from "./valueObject";

// ============================================
// Bookmark Events
// ============================================

export type BookmarkCreatedEvent = DomainEventBase<
  "bookmark.created",
  { bookmarkId: BookmarkIdType; userId: UserIdType }
>;

export type BookmarkUpdatedEvent = DomainEventBase<
  "bookmark.updated",
  { bookmarkId: BookmarkIdType }
>;

export type BookmarkDeletedEvent = DomainEventBase<
  "bookmark.deleted",
  { bookmarkId: BookmarkIdType; userId: UserIdType }
>;

// ============================================
// Union Types
// ============================================

export type BookmarkEvent =
  | BookmarkCreatedEvent
  | BookmarkUpdatedEvent
  | BookmarkDeletedEvent;

// ============================================
// Event Factories
// ============================================

export const BookmarkEvents = {
  created: (
    bookmarkId: BookmarkIdType,
    userId: UserIdType,
  ): BookmarkCreatedEvent => ({
    type: "bookmark.created",
    payload: { bookmarkId, userId },
    occurredAt: new Date(),
  }),

  updated: (bookmarkId: BookmarkIdType): BookmarkUpdatedEvent => ({
    type: "bookmark.updated",
    payload: { bookmarkId },
    occurredAt: new Date(),
  }),

  deleted: (
    bookmarkId: BookmarkIdType,
    userId: UserIdType,
  ): BookmarkDeletedEvent => ({
    type: "bookmark.deleted",
    payload: { bookmarkId, userId },
    occurredAt: new Date(),
  }),
};
