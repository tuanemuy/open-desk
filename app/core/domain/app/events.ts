import type { DomainEventBase } from "@/core/domain/common/event";
import type {
  AppId as AppIdType,
  FieldId as FieldIdType,
  ReportId as ReportIdType,
  ViewId as ViewIdType,
} from "./valueObject";

// ============================================
// App Events
// ============================================

export type AppCreatedEvent = DomainEventBase<
  "app.created",
  { appId: AppIdType }
>;

export type AppDeployedEvent = DomainEventBase<
  "app.deployed",
  { appId: AppIdType }
>;

export type AppSettingsUpdatedEvent = DomainEventBase<
  "app.settingsUpdated",
  { appId: AppIdType }
>;

export type AppDeletedEvent = DomainEventBase<
  "app.deleted",
  { appId: AppIdType }
>;

export type AppRestoredEvent = DomainEventBase<
  "app.restored",
  { appId: AppIdType }
>;

// ============================================
// Field Events
// ============================================

export type FieldAddedEvent = DomainEventBase<
  "app.field.added",
  { appId: AppIdType; fieldId: FieldIdType }
>;

export type FieldUpdatedEvent = DomainEventBase<
  "app.field.updated",
  { appId: AppIdType; fieldId: FieldIdType }
>;

export type FieldDeletedEvent = DomainEventBase<
  "app.field.deleted",
  { appId: AppIdType; fieldId: FieldIdType }
>;

// ============================================
// View Events
// ============================================

export type ViewCreatedEvent = DomainEventBase<
  "app.view.created",
  { appId: AppIdType; viewId: ViewIdType }
>;

export type ViewDeletedEvent = DomainEventBase<
  "app.view.deleted",
  { appId: AppIdType; viewId: ViewIdType }
>;

// ============================================
// Report Events
// ============================================

export type ReportCreatedEvent = DomainEventBase<
  "app.report.created",
  { appId: AppIdType; reportId: ReportIdType }
>;

export type ReportDeletedEvent = DomainEventBase<
  "app.report.deleted",
  { appId: AppIdType; reportId: ReportIdType }
>;

// ============================================
// Union Types
// ============================================

export type AppEvent =
  | AppCreatedEvent
  | AppDeployedEvent
  | AppSettingsUpdatedEvent
  | AppDeletedEvent
  | AppRestoredEvent;

export type FieldEvent =
  | FieldAddedEvent
  | FieldUpdatedEvent
  | FieldDeletedEvent;

export type ViewEvent = ViewCreatedEvent | ViewDeletedEvent;

export type ReportEvent = ReportCreatedEvent | ReportDeletedEvent;

export type AppDomainEvent = AppEvent | FieldEvent | ViewEvent | ReportEvent;

// ============================================
// Event Factories
// ============================================

export const AppEvents = {
  created: (appId: AppIdType): AppCreatedEvent => ({
    type: "app.created",
    payload: { appId },
    occurredAt: new Date(),
  }),

  deployed: (appId: AppIdType): AppDeployedEvent => ({
    type: "app.deployed",
    payload: { appId },
    occurredAt: new Date(),
  }),

  settingsUpdated: (appId: AppIdType): AppSettingsUpdatedEvent => ({
    type: "app.settingsUpdated",
    payload: { appId },
    occurredAt: new Date(),
  }),

  deleted: (appId: AppIdType): AppDeletedEvent => ({
    type: "app.deleted",
    payload: { appId },
    occurredAt: new Date(),
  }),

  restored: (appId: AppIdType): AppRestoredEvent => ({
    type: "app.restored",
    payload: { appId },
    occurredAt: new Date(),
  }),

  fieldAdded: (appId: AppIdType, fieldId: FieldIdType): FieldAddedEvent => ({
    type: "app.field.added",
    payload: { appId, fieldId },
    occurredAt: new Date(),
  }),

  fieldUpdated: (
    appId: AppIdType,
    fieldId: FieldIdType,
  ): FieldUpdatedEvent => ({
    type: "app.field.updated",
    payload: { appId, fieldId },
    occurredAt: new Date(),
  }),

  fieldDeleted: (
    appId: AppIdType,
    fieldId: FieldIdType,
  ): FieldDeletedEvent => ({
    type: "app.field.deleted",
    payload: { appId, fieldId },
    occurredAt: new Date(),
  }),

  viewCreated: (appId: AppIdType, viewId: ViewIdType): ViewCreatedEvent => ({
    type: "app.view.created",
    payload: { appId, viewId },
    occurredAt: new Date(),
  }),

  viewDeleted: (appId: AppIdType, viewId: ViewIdType): ViewDeletedEvent => ({
    type: "app.view.deleted",
    payload: { appId, viewId },
    occurredAt: new Date(),
  }),

  reportCreated: (
    appId: AppIdType,
    reportId: ReportIdType,
  ): ReportCreatedEvent => ({
    type: "app.report.created",
    payload: { appId, reportId },
    occurredAt: new Date(),
  }),

  reportDeleted: (
    appId: AppIdType,
    reportId: ReportIdType,
  ): ReportDeletedEvent => ({
    type: "app.report.deleted",
    payload: { appId, reportId },
    occurredAt: new Date(),
  }),
};
