import type { DomainEventBase } from "@/core/domain/common/event";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { PostId as PostIdType } from "./valueObject";

// ============================================
// Profile Events
// ============================================

export type ProfileUpdatedEvent = DomainEventBase<
  "people.profile.updated",
  { userId: UserIdType }
>;

// ============================================
// Post Events
// ============================================

export type PostCreatedEvent = DomainEventBase<
  "people.post.created",
  { postId: PostIdType; authorId: UserIdType }
>;

export type PostDeletedEvent = DomainEventBase<
  "people.post.deleted",
  { postId: PostIdType; authorId: UserIdType }
>;

// ============================================
// Follow Events
// ============================================

export type FollowCreatedEvent = DomainEventBase<
  "people.follow.created",
  { followerId: UserIdType; followeeId: UserIdType }
>;

export type FollowDeletedEvent = DomainEventBase<
  "people.follow.deleted",
  { followerId: UserIdType; followeeId: UserIdType }
>;

// ============================================
// Union Types
// ============================================

export type ProfileEvent = ProfileUpdatedEvent;

export type PostEvent = PostCreatedEvent | PostDeletedEvent;

export type FollowEvent = FollowCreatedEvent | FollowDeletedEvent;

export type PeopleEvent = ProfileEvent | PostEvent | FollowEvent;

// ============================================
// Event Factories
// ============================================

export const PeopleEvents = {
  profileUpdated: (userId: UserIdType): ProfileUpdatedEvent => ({
    type: "people.profile.updated",
    payload: { userId },
    occurredAt: new Date(),
  }),

  postCreated: (
    postId: PostIdType,
    authorId: UserIdType,
  ): PostCreatedEvent => ({
    type: "people.post.created",
    payload: { postId, authorId },
    occurredAt: new Date(),
  }),

  postDeleted: (
    postId: PostIdType,
    authorId: UserIdType,
  ): PostDeletedEvent => ({
    type: "people.post.deleted",
    payload: { postId, authorId },
    occurredAt: new Date(),
  }),

  followCreated: (
    followerId: UserIdType,
    followeeId: UserIdType,
  ): FollowCreatedEvent => ({
    type: "people.follow.created",
    payload: { followerId, followeeId },
    occurredAt: new Date(),
  }),

  followDeleted: (
    followerId: UserIdType,
    followeeId: UserIdType,
  ): FollowDeletedEvent => ({
    type: "people.follow.deleted",
    payload: { followerId, followeeId },
    occurredAt: new Date(),
  }),
};
