import type { DomainEventBase } from "@/core/domain/common/event";
import type {
  GroupId as GroupIdType,
  OrganizationId as OrganizationIdType,
  SessionId as SessionIdType,
  UserId as UserIdType,
} from "./valueObject";

// ============================================
// User Events
// ============================================

export type UserCreatedEvent = DomainEventBase<
  "identity.user.created",
  { userId: UserIdType }
>;

export type UserActivatedEvent = DomainEventBase<
  "identity.user.activated",
  { userId: UserIdType }
>;

export type UserDeactivatedEvent = DomainEventBase<
  "identity.user.deactivated",
  { userId: UserIdType }
>;

export type UserProfileUpdatedEvent = DomainEventBase<
  "identity.user.profileUpdated",
  { userId: UserIdType }
>;

export type UserDeletedEvent = DomainEventBase<
  "identity.user.deleted",
  { userId: UserIdType }
>;

// ============================================
// Organization Events
// ============================================

export type OrganizationCreatedEvent = DomainEventBase<
  "identity.organization.created",
  { organizationId: OrganizationIdType }
>;

export type OrganizationDeletedEvent = DomainEventBase<
  "identity.organization.deleted",
  { organizationId: OrganizationIdType }
>;

// ============================================
// Group Events
// ============================================

export type GroupCreatedEvent = DomainEventBase<
  "identity.group.created",
  { groupId: GroupIdType }
>;

export type GroupDeletedEvent = DomainEventBase<
  "identity.group.deleted",
  { groupId: GroupIdType }
>;

// ============================================
// Session Events
// ============================================

export type SessionCreatedEvent = DomainEventBase<
  "identity.session.created",
  { sessionId: SessionIdType; userId: UserIdType }
>;

export type SessionTerminatedEvent = DomainEventBase<
  "identity.session.terminated",
  { sessionId: SessionIdType; userId: UserIdType }
>;

// ============================================
// Union Types
// ============================================

export type UserEvent =
  | UserCreatedEvent
  | UserActivatedEvent
  | UserDeactivatedEvent
  | UserProfileUpdatedEvent
  | UserDeletedEvent;

export type OrganizationEvent =
  | OrganizationCreatedEvent
  | OrganizationDeletedEvent;

export type GroupEvent = GroupCreatedEvent | GroupDeletedEvent;

export type SessionEvent = SessionCreatedEvent | SessionTerminatedEvent;

export type IdentityEvent =
  | UserEvent
  | OrganizationEvent
  | GroupEvent
  | SessionEvent;

// ============================================
// Event Factories
// ============================================

export const IdentityEvents = {
  userCreated: (userId: UserIdType): UserCreatedEvent => ({
    type: "identity.user.created",
    payload: { userId },
    occurredAt: new Date(),
  }),

  userActivated: (userId: UserIdType): UserActivatedEvent => ({
    type: "identity.user.activated",
    payload: { userId },
    occurredAt: new Date(),
  }),

  userDeactivated: (userId: UserIdType): UserDeactivatedEvent => ({
    type: "identity.user.deactivated",
    payload: { userId },
    occurredAt: new Date(),
  }),

  userProfileUpdated: (userId: UserIdType): UserProfileUpdatedEvent => ({
    type: "identity.user.profileUpdated",
    payload: { userId },
    occurredAt: new Date(),
  }),

  userDeleted: (userId: UserIdType): UserDeletedEvent => ({
    type: "identity.user.deleted",
    payload: { userId },
    occurredAt: new Date(),
  }),

  organizationCreated: (
    organizationId: OrganizationIdType,
  ): OrganizationCreatedEvent => ({
    type: "identity.organization.created",
    payload: { organizationId },
    occurredAt: new Date(),
  }),

  organizationDeleted: (
    organizationId: OrganizationIdType,
  ): OrganizationDeletedEvent => ({
    type: "identity.organization.deleted",
    payload: { organizationId },
    occurredAt: new Date(),
  }),

  groupCreated: (groupId: GroupIdType): GroupCreatedEvent => ({
    type: "identity.group.created",
    payload: { groupId },
    occurredAt: new Date(),
  }),

  groupDeleted: (groupId: GroupIdType): GroupDeletedEvent => ({
    type: "identity.group.deleted",
    payload: { groupId },
    occurredAt: new Date(),
  }),

  sessionCreated: (
    sessionId: SessionIdType,
    userId: UserIdType,
  ): SessionCreatedEvent => ({
    type: "identity.session.created",
    payload: { sessionId, userId },
    occurredAt: new Date(),
  }),

  sessionTerminated: (
    sessionId: SessionIdType,
    userId: UserIdType,
  ): SessionTerminatedEvent => ({
    type: "identity.session.terminated",
    payload: { sessionId, userId },
    occurredAt: new Date(),
  }),
};
