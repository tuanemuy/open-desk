import type { AppId } from "@/core/domain/app/valueObject";
import type { DomainEventBase } from "@/core/domain/common/event";
import type {
  CommentId as CommentIdType,
  CsvExportJobId as CsvExportJobIdType,
  CsvImportJobId as CsvImportJobIdType,
  ProcessStatus as ProcessStatusType,
  RecordId as RecordIdType,
} from "./valueObject";

// ============================================
// Record Events
// ============================================

export type RecordCreatedEvent = DomainEventBase<
  "record.created",
  { recordId: RecordIdType; appId: AppId }
>;

export type RecordUpdatedEvent = DomainEventBase<
  "record.updated",
  { recordId: RecordIdType; appId: AppId }
>;

export type RecordDeletedEvent = DomainEventBase<
  "record.deleted",
  { recordIds: readonly RecordIdType[]; appId: AppId }
>;

export type RecordStatusChangedEvent = DomainEventBase<
  "record.statusChanged",
  {
    recordId: RecordIdType;
    appId: AppId;
    newStatus: ProcessStatusType;
  }
>;

export type RecordCommentAddedEvent = DomainEventBase<
  "record.commentAdded",
  {
    commentId: CommentIdType;
    recordId: RecordIdType;
    appId: AppId;
  }
>;

export type RecordCommentDeletedEvent = DomainEventBase<
  "record.commentDeleted",
  {
    commentId: CommentIdType;
    recordId: RecordIdType;
    appId: AppId;
  }
>;

// ============================================
// CSV Import Job Events
// ============================================

export type CsvImportJobCompletedEvent = DomainEventBase<
  "record.csvImportJob.completed",
  { jobId: CsvImportJobIdType; appId: AppId }
>;

export type CsvImportJobFailedEvent = DomainEventBase<
  "record.csvImportJob.failed",
  { jobId: CsvImportJobIdType; appId: AppId }
>;

// ============================================
// CSV Export Job Events
// ============================================

export type CsvExportJobCompletedEvent = DomainEventBase<
  "record.csvExportJob.completed",
  { jobId: CsvExportJobIdType; appId: AppId }
>;

export type CsvExportJobFailedEvent = DomainEventBase<
  "record.csvExportJob.failed",
  { jobId: CsvExportJobIdType; appId: AppId }
>;

// ============================================
// Union Types
// ============================================

export type RecordEvent =
  | RecordCreatedEvent
  | RecordUpdatedEvent
  | RecordDeletedEvent
  | RecordStatusChangedEvent
  | RecordCommentAddedEvent
  | RecordCommentDeletedEvent;

export type CsvImportJobEvent =
  | CsvImportJobCompletedEvent
  | CsvImportJobFailedEvent;

export type CsvExportJobEvent =
  | CsvExportJobCompletedEvent
  | CsvExportJobFailedEvent;

export type RecordDomainEvent =
  | RecordEvent
  | CsvImportJobEvent
  | CsvExportJobEvent;

// ============================================
// Event Factories
// ============================================

export const RecordEvents = {
  created: (recordId: RecordIdType, appId: AppId): RecordCreatedEvent => ({
    type: "record.created",
    payload: { recordId, appId },
    occurredAt: new Date(),
  }),

  updated: (recordId: RecordIdType, appId: AppId): RecordUpdatedEvent => ({
    type: "record.updated",
    payload: { recordId, appId },
    occurredAt: new Date(),
  }),

  deleted: (
    recordIds: readonly RecordIdType[],
    appId: AppId,
  ): RecordDeletedEvent => ({
    type: "record.deleted",
    payload: { recordIds, appId },
    occurredAt: new Date(),
  }),

  statusChanged: (
    recordId: RecordIdType,
    appId: AppId,
    newStatus: ProcessStatusType,
  ): RecordStatusChangedEvent => ({
    type: "record.statusChanged",
    payload: { recordId, appId, newStatus },
    occurredAt: new Date(),
  }),

  commentAdded: (
    commentId: CommentIdType,
    recordId: RecordIdType,
    appId: AppId,
  ): RecordCommentAddedEvent => ({
    type: "record.commentAdded",
    payload: { commentId, recordId, appId },
    occurredAt: new Date(),
  }),

  commentDeleted: (
    commentId: CommentIdType,
    recordId: RecordIdType,
    appId: AppId,
  ): RecordCommentDeletedEvent => ({
    type: "record.commentDeleted",
    payload: { commentId, recordId, appId },
    occurredAt: new Date(),
  }),

  csvImportJobCompleted: (
    jobId: CsvImportJobIdType,
    appId: AppId,
  ): CsvImportJobCompletedEvent => ({
    type: "record.csvImportJob.completed",
    payload: { jobId, appId },
    occurredAt: new Date(),
  }),

  csvImportJobFailed: (
    jobId: CsvImportJobIdType,
    appId: AppId,
  ): CsvImportJobFailedEvent => ({
    type: "record.csvImportJob.failed",
    payload: { jobId, appId },
    occurredAt: new Date(),
  }),

  csvExportJobCompleted: (
    jobId: CsvExportJobIdType,
    appId: AppId,
  ): CsvExportJobCompletedEvent => ({
    type: "record.csvExportJob.completed",
    payload: { jobId, appId },
    occurredAt: new Date(),
  }),

  csvExportJobFailed: (
    jobId: CsvExportJobIdType,
    appId: AppId,
  ): CsvExportJobFailedEvent => ({
    type: "record.csvExportJob.failed",
    payload: { jobId, appId },
    occurredAt: new Date(),
  }),
};
