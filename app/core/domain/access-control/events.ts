import type { AppId as AppIdType } from "@/core/domain/app/valueObject";
import type { DomainEventBase } from "@/core/domain/common/event";
import type { SystemPermissionId as SystemPermissionIdType } from "./valueObject";

// ============================================
// AppAcl Events
// ============================================

export type AppAclUpdatedEvent = DomainEventBase<
  "accessControl.appAcl.updated",
  { appId: AppIdType }
>;

// ============================================
// RecordAcl Events
// ============================================

export type RecordAclUpdatedEvent = DomainEventBase<
  "accessControl.recordAcl.updated",
  { appId: AppIdType }
>;

// ============================================
// FieldAcl Events
// ============================================

export type FieldAclUpdatedEvent = DomainEventBase<
  "accessControl.fieldAcl.updated",
  { appId: AppIdType }
>;

// ============================================
// SystemPermission Events
// ============================================

export type SystemPermissionUpdatedEvent = DomainEventBase<
  "accessControl.systemPermission.updated",
  { systemPermissionId: SystemPermissionIdType }
>;

export type SystemPermissionDeletedEvent = DomainEventBase<
  "accessControl.systemPermission.deleted",
  { systemPermissionId: SystemPermissionIdType }
>;

// ============================================
// Union Types
// ============================================

export type AppAclEvent = AppAclUpdatedEvent;

export type RecordAclEvent = RecordAclUpdatedEvent;

export type FieldAclEvent = FieldAclUpdatedEvent;

export type SystemPermissionEvent =
  | SystemPermissionUpdatedEvent
  | SystemPermissionDeletedEvent;

export type AccessControlEvent =
  | AppAclEvent
  | RecordAclEvent
  | FieldAclEvent
  | SystemPermissionEvent;

// ============================================
// Event Factories
// ============================================

export const AccessControlEvents = {
  appAclUpdated: (appId: AppIdType): AppAclUpdatedEvent => ({
    type: "accessControl.appAcl.updated",
    payload: { appId },
    occurredAt: new Date(),
  }),

  recordAclUpdated: (appId: AppIdType): RecordAclUpdatedEvent => ({
    type: "accessControl.recordAcl.updated",
    payload: { appId },
    occurredAt: new Date(),
  }),

  fieldAclUpdated: (appId: AppIdType): FieldAclUpdatedEvent => ({
    type: "accessControl.fieldAcl.updated",
    payload: { appId },
    occurredAt: new Date(),
  }),

  systemPermissionUpdated: (
    systemPermissionId: SystemPermissionIdType,
  ): SystemPermissionUpdatedEvent => ({
    type: "accessControl.systemPermission.updated",
    payload: { systemPermissionId },
    occurredAt: new Date(),
  }),

  systemPermissionDeleted: (
    systemPermissionId: SystemPermissionIdType,
  ): SystemPermissionDeletedEvent => ({
    type: "accessControl.systemPermission.deleted",
    payload: { systemPermissionId },
    occurredAt: new Date(),
  }),
};
