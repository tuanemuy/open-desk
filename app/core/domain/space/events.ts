import type { DomainEventBase } from "@/core/domain/common/event";
import type { UserId } from "@/core/domain/identity/valueObject";
import type {
  SpaceId as SpaceIdType,
  ThreadCommentId as ThreadCommentIdType,
  ThreadId as ThreadIdType,
} from "./valueObject";

// ============================================
// Space Events
// ============================================

export type SpaceCreatedEvent = DomainEventBase<
  "space.space.created",
  { spaceId: SpaceIdType; creatorId: UserId }
>;

export type SpaceDeletedEvent = DomainEventBase<
  "space.space.deleted",
  { spaceId: SpaceIdType }
>;

export type SpaceSettingsUpdatedEvent = DomainEventBase<
  "space.space.settingsUpdated",
  { spaceId: SpaceIdType }
>;

// ============================================
// Thread Events
// ============================================

export type ThreadCreatedEvent = DomainEventBase<
  "space.thread.created",
  {
    threadId: ThreadIdType;
    spaceId: SpaceIdType;
    creatorId: UserId;
    notifyOnCreate: boolean;
  }
>;

export type ThreadDeletedEvent = DomainEventBase<
  "space.thread.deleted",
  { threadId: ThreadIdType; spaceId: SpaceIdType }
>;

// ============================================
// ThreadComment Events
// ============================================

export type ThreadCommentCreatedEvent = DomainEventBase<
  "space.threadComment.created",
  {
    commentId: ThreadCommentIdType;
    threadId: ThreadIdType;
    spaceId: SpaceIdType;
    creatorId: UserId;
  }
>;

export type ThreadCommentDeletedEvent = DomainEventBase<
  "space.threadComment.deleted",
  {
    commentId: ThreadCommentIdType;
    threadId: ThreadIdType;
    spaceId: SpaceIdType;
  }
>;

// ============================================
// SpaceMember Events
// ============================================

export type SpaceMembersUpdatedEvent = DomainEventBase<
  "space.member.updated",
  { spaceId: SpaceIdType }
>;

// ============================================
// Union Types
// ============================================

export type SpaceEvent =
  | SpaceCreatedEvent
  | SpaceDeletedEvent
  | SpaceSettingsUpdatedEvent
  | ThreadCreatedEvent
  | ThreadDeletedEvent
  | ThreadCommentCreatedEvent
  | ThreadCommentDeletedEvent
  | SpaceMembersUpdatedEvent;

// ============================================
// Event Factories
// ============================================

export const SpaceEvents = {
  spaceCreated: (
    spaceId: SpaceIdType,
    creatorId: UserId,
  ): SpaceCreatedEvent => ({
    type: "space.space.created",
    payload: { spaceId, creatorId },
    occurredAt: new Date(),
  }),

  spaceDeleted: (spaceId: SpaceIdType): SpaceDeletedEvent => ({
    type: "space.space.deleted",
    payload: { spaceId },
    occurredAt: new Date(),
  }),

  spaceSettingsUpdated: (spaceId: SpaceIdType): SpaceSettingsUpdatedEvent => ({
    type: "space.space.settingsUpdated",
    payload: { spaceId },
    occurredAt: new Date(),
  }),

  threadCreated: (
    threadId: ThreadIdType,
    spaceId: SpaceIdType,
    creatorId: UserId,
    notifyOnCreate: boolean,
  ): ThreadCreatedEvent => ({
    type: "space.thread.created",
    payload: { threadId, spaceId, creatorId, notifyOnCreate },
    occurredAt: new Date(),
  }),

  threadDeleted: (
    threadId: ThreadIdType,
    spaceId: SpaceIdType,
  ): ThreadDeletedEvent => ({
    type: "space.thread.deleted",
    payload: { threadId, spaceId },
    occurredAt: new Date(),
  }),

  threadCommentCreated: (
    commentId: ThreadCommentIdType,
    threadId: ThreadIdType,
    spaceId: SpaceIdType,
    creatorId: UserId,
  ): ThreadCommentCreatedEvent => ({
    type: "space.threadComment.created",
    payload: { commentId, threadId, spaceId, creatorId },
    occurredAt: new Date(),
  }),

  threadCommentDeleted: (
    commentId: ThreadCommentIdType,
    threadId: ThreadIdType,
    spaceId: SpaceIdType,
  ): ThreadCommentDeletedEvent => ({
    type: "space.threadComment.deleted",
    payload: { commentId, threadId, spaceId },
    occurredAt: new Date(),
  }),

  spaceMembersUpdated: (spaceId: SpaceIdType): SpaceMembersUpdatedEvent => ({
    type: "space.member.updated",
    payload: { spaceId },
    occurredAt: new Date(),
  }),
};
