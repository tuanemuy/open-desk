import type { DomainEventBase } from "@/core/domain/common/event";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { FileKey as FileKeyType } from "./valueObject";

// ============================================
// StoredFile Events
// ============================================

export type FileUploadedEvent = DomainEventBase<
  "file.uploaded",
  { fileKey: FileKeyType; uploaderId: UserIdType }
>;

export type FileAttachedEvent = DomainEventBase<
  "file.attached",
  { oldFileKey: FileKeyType; newFileKey: FileKeyType }
>;

export type FileDeletedEvent = DomainEventBase<
  "file.deleted",
  { fileKey: FileKeyType }
>;

// ============================================
// Union Types
// ============================================

export type FileEvent =
  | FileUploadedEvent
  | FileAttachedEvent
  | FileDeletedEvent;

// ============================================
// Event Factories
// ============================================

export const FileEvents = {
  uploaded: (
    fileKey: FileKeyType,
    uploaderId: UserIdType,
  ): FileUploadedEvent => ({
    type: "file.uploaded",
    payload: { fileKey, uploaderId },
    occurredAt: new Date(),
  }),

  attached: (
    oldFileKey: FileKeyType,
    newFileKey: FileKeyType,
  ): FileAttachedEvent => ({
    type: "file.attached",
    payload: { oldFileKey, newFileKey },
    occurredAt: new Date(),
  }),

  deleted: (fileKey: FileKeyType): FileDeletedEvent => ({
    type: "file.deleted",
    payload: { fileKey },
    occurredAt: new Date(),
  }),
};
