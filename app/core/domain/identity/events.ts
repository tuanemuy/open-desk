import type { DomainEventBase } from "@/core/domain/common/event";
import type {
  ExternalId as ExternalIdType,
  GroupId as GroupIdType,
  OrganizationId as OrganizationIdType,
  ScimResourceType as ScimResourceTypeType,
  SessionId as SessionIdType,
  TitleId as TitleIdType,
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
// Title Events
// ============================================

export type TitleCreatedEvent = DomainEventBase<
  "identity.title.created",
  { titleId: TitleIdType }
>;

export type TitleDeletedEvent = DomainEventBase<
  "identity.title.deleted",
  { titleId: TitleIdType }
>;

// ============================================
// ProvisioningConfig Events
// ============================================

export type ProvisioningEnabledEvent = DomainEventBase<
  "identity.provisioning.enabled",
  Record<string, never>
>;

export type ProvisioningDisabledEvent = DomainEventBase<
  "identity.provisioning.disabled",
  Record<string, never>
>;

// ============================================
// ScimExternalMapping Events
// ============================================

export type ScimExternalMappingCreatedEvent = DomainEventBase<
  "identity.scimExternalMapping.created",
  { externalId: ExternalIdType; resourceType: ScimResourceTypeType }
>;

export type ScimExternalMappingDeletedEvent = DomainEventBase<
  "identity.scimExternalMapping.deleted",
  { externalId: ExternalIdType; resourceType: ScimResourceTypeType }
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

export type TitleEvent = TitleCreatedEvent | TitleDeletedEvent;

export type ProvisioningConfigEvent =
  | ProvisioningEnabledEvent
  | ProvisioningDisabledEvent;

export type ScimExternalMappingEvent =
  | ScimExternalMappingCreatedEvent
  | ScimExternalMappingDeletedEvent;

export type IdentityEvent =
  | UserEvent
  | OrganizationEvent
  | GroupEvent
  | SessionEvent
  | TitleEvent
  | ProvisioningConfigEvent
  | ScimExternalMappingEvent;

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

  titleCreated: (titleId: TitleIdType): TitleCreatedEvent => ({
    type: "identity.title.created",
    payload: { titleId },
    occurredAt: new Date(),
  }),

  titleDeleted: (titleId: TitleIdType): TitleDeletedEvent => ({
    type: "identity.title.deleted",
    payload: { titleId },
    occurredAt: new Date(),
  }),

  provisioningEnabled: (): ProvisioningEnabledEvent => ({
    type: "identity.provisioning.enabled",
    payload: {},
    occurredAt: new Date(),
  }),

  provisioningDisabled: (): ProvisioningDisabledEvent => ({
    type: "identity.provisioning.disabled",
    payload: {},
    occurredAt: new Date(),
  }),

  scimExternalMappingCreated: (
    externalId: ExternalIdType,
    resourceType: ScimResourceTypeType,
  ): ScimExternalMappingCreatedEvent => ({
    type: "identity.scimExternalMapping.created",
    payload: { externalId, resourceType },
    occurredAt: new Date(),
  }),

  scimExternalMappingDeleted: (
    externalId: ExternalIdType,
    resourceType: ScimResourceTypeType,
  ): ScimExternalMappingDeletedEvent => ({
    type: "identity.scimExternalMapping.deleted",
    payload: { externalId, resourceType },
    occurredAt: new Date(),
  }),
};
