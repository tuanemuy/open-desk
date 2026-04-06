import type { AppId } from "@/core/domain/app/valueObject";
import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId } from "@/core/domain/identity/valueObject";
import { RecordErrorCode } from "./errorCode";
import type {
  CsvExportJobEvent,
  CsvImportJobEvent,
  RecordEvent,
} from "./events";
import { RecordEvents } from "./events";
import type {
  CommentId as CommentIdType,
  CsvDelimiter as CsvDelimiterType,
  CsvEncoding as CsvEncodingType,
  CsvExportJobId as CsvExportJobIdType,
  CsvExportJobStatus as CsvExportJobStatusType,
  CsvImportError as CsvImportErrorType,
  CsvImportJobId as CsvImportJobIdType,
  CsvImportJobStatus as CsvImportJobStatusType,
  CursorId as CursorIdType,
  ErrorHandling as ErrorHandlingType,
  FieldCode as FieldCodeType,
  FieldDiff,
  FieldMapping as FieldMappingType,
  FieldValue,
  HistoryId as HistoryIdType,
  ImportMode as ImportModeType,
  Mention,
  ProcessStatus as ProcessStatusType,
  RecordId as RecordIdType,
} from "./valueObject";
import {
  CommentId,
  CsvExportJobId,
  CsvExportJobStatus,
  CsvImportJobId,
  CsvImportJobStatus,
  CursorId,
  FieldType,
  HistoryId,
  RecordId,
} from "./valueObject";

// ============================================
// Constants
// ============================================

const MAX_ASSIGNEES = 100;
const MAX_COMMENT_TEXT_LENGTH = 65535;
const MAX_MENTIONS = 10;
const REVISION_INCREMENT_STATUS_CHANGE = 2;
const CURSOR_EXPIRY_MINUTES = 10;
const CURSOR_MIN_SIZE = 1;
const CURSOR_MAX_SIZE = 500;
const CURSOR_DEFAULT_SIZE = 100;
const EXPORT_EXPIRY_DAYS = 3;
const EXCEL_MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const EXCEL_MAX_ROWS = 1000;
const CSV_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const CSV_MAX_ROWS = 100000;

// ============================================
// Record Entity
// ============================================

type _Record = Readonly<{
  recordId: RecordIdType;
  appId: AppId;
  revision: number;
  fieldValues: ReadonlyMap<FieldCodeType, FieldValue>;
  status: ProcessStatusType | null;
  statusAssignees: readonly UserId[];
  creatorId: UserId;
  createdAt: Date;
  modifierId: UserId;
  updatedAt: Date;
}>;

export type Record = _Record;

export const Record = {
  /**
   * Create a new Record entity with revision 1.
   */
  create: (params: {
    appId: AppId;
    creatorId: UserId;
    status?: ProcessStatusType | null;
    statusAssignees?: readonly UserId[];
  }): WithEvents<_Record, RecordEvent> => {
    const now = new Date();
    const record: _Record = {
      recordId: RecordId.generate(),
      appId: params.appId,
      revision: 1,
      fieldValues: new Map(),
      status: params.status ?? null,
      statusAssignees: params.statusAssignees ?? [],
      creatorId: params.creatorId,
      createdAt: now,
      modifierId: params.creatorId,
      updatedAt: now,
    };

    return {
      entity: record,
      events: [RecordEvents.created(record.recordId, record.appId)],
    };
  },

  /**
   * Reconstruct a Record entity from persisted data.
   */
  reconstruct: (data: _Record): _Record => data,

  /**
   * Update field values on the record.
   * Read-only fields (LOOKUP, STATUS, CATEGORY, CALC, STATUS_ASSIGNEE, etc.) cannot be updated.
   * Create-only fields (CREATOR, CREATED_TIME) cannot be updated after creation.
   *
   * @throws BusinessRuleError with InvalidFieldUpdate if a read-only or create-only field is written
   */
  updateFieldValues: (
    record: _Record,
    values: ReadonlyMap<FieldCodeType, FieldValue>,
    isUpdate: boolean,
  ): WithEvents<_Record, RecordEvent> => {
    const newFieldValues = new Map(record.fieldValues);

    for (const [fieldCode, fieldValue] of values) {
      if (FieldType.isReadOnly(fieldValue.type)) {
        throw new BusinessRuleError(
          RecordErrorCode.InvalidFieldUpdate,
          `Field type ${fieldValue.type} is read-only and cannot be updated`,
        );
      }

      if (isUpdate && FieldType.isCreateOnly(fieldValue.type)) {
        throw new BusinessRuleError(
          RecordErrorCode.InvalidFieldUpdate,
          `Field type ${fieldValue.type} can only be set at creation time`,
        );
      }

      newFieldValues.set(fieldCode, fieldValue);
    }

    return {
      entity: {
        ...record,
        fieldValues: newFieldValues,
      },
      events: [],
    };
  },

  /**
   * Increment the revision by 1. Called on normal update/delete operations.
   */
  incrementRevision: (record: _Record): _Record => {
    return {
      ...record,
      revision: record.revision + 1,
    };
  },

  /**
   * Get the value of a specific field.
   * @throws BusinessRuleError with FieldNotFound if the field code does not exist
   */
  getFieldValue: (record: _Record, fieldCode: FieldCodeType): FieldValue => {
    const value = record.fieldValues.get(fieldCode);
    if (value === undefined) {
      throw new BusinessRuleError(
        RecordErrorCode.FieldNotFound,
        `Field code ${fieldCode} not found in record ${record.recordId}`,
      );
    }
    return value;
  },

  /**
   * Reuse (copy) the record to create a draft for a new record.
   * System fields are excluded from the copy.
   * Status is reset to null (will be set to initial status by the use case).
   * Calculated fields are excluded (will be recalculated).
   */
  reuse: (record: _Record, newCreatorId: UserId): _Record => {
    const copiedFieldValues = new Map<FieldCodeType, FieldValue>();
    for (const [fieldCode, fieldValue] of record.fieldValues) {
      if (!FieldType.isSystemField(fieldValue.type)) {
        copiedFieldValues.set(fieldCode, fieldValue);
      }
    }

    const now = new Date();
    return {
      recordId: RecordId.generate(),
      appId: record.appId,
      revision: 1,
      fieldValues: copiedFieldValues,
      status: null,
      statusAssignees: [],
      creatorId: newCreatorId,
      createdAt: now,
      modifierId: newCreatorId,
      updatedAt: now,
    };
  },

  /**
   * Check if the expected revision matches the current revision (optimistic locking).
   * A value of -1 skips the check.
   * @throws BusinessRuleError with RevisionConflict if revisions do not match
   */
  checkRevision: (record: _Record, expectedRevision: number): void => {
    if (expectedRevision === -1) {
      return;
    }
    if (record.revision !== expectedRevision) {
      throw new BusinessRuleError(
        RecordErrorCode.RevisionConflict,
        `Expected revision ${expectedRevision} but current revision is ${record.revision}`,
      );
    }
  },

  /**
   * Change the process status and increment revision by 2
   * (one for the action execution, one for the status change).
   * @throws BusinessRuleError with InvalidStatusTransition for invalid transitions
   */
  changeStatus: (
    record: _Record,
    newStatus: ProcessStatusType,
    assignees: readonly UserId[],
  ): WithEvents<_Record, RecordEvent> => {
    if (assignees.length > MAX_ASSIGNEES) {
      throw new BusinessRuleError(
        RecordErrorCode.TooManyAssignees,
        `Cannot assign more than ${MAX_ASSIGNEES} assignees`,
      );
    }

    return {
      entity: {
        ...record,
        status: newStatus,
        statusAssignees: assignees,
        revision: record.revision + REVISION_INCREMENT_STATUS_CHANGE,
        updatedAt: new Date(),
      },
      events: [
        RecordEvents.statusChanged(record.recordId, record.appId, newStatus),
      ],
    };
  },

  /**
   * Update the assignees for the current process status.
   * @throws BusinessRuleError with TooManyAssignees if more than 100 assignees
   */
  updateAssignees: (
    record: _Record,
    assignees: readonly UserId[],
  ): WithEvents<_Record, RecordEvent> => {
    if (assignees.length > MAX_ASSIGNEES) {
      throw new BusinessRuleError(
        RecordErrorCode.TooManyAssignees,
        `Cannot assign more than ${MAX_ASSIGNEES} assignees`,
      );
    }

    return {
      entity: {
        ...record,
        statusAssignees: assignees,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  /**
   * Set the modifier and updated timestamp.
   */
  setModifier: (record: _Record, modifierId: UserId): _Record => {
    return {
      ...record,
      modifierId,
      updatedAt: new Date(),
    };
  },
};

// ============================================
// RecordComment Entity
// ============================================

type _RecordComment = Readonly<{
  commentId: CommentIdType;
  recordId: RecordIdType;
  appId: AppId;
  text: string;
  mentions: readonly Mention[];
  likes: ReadonlySet<UserId>;
  creatorId: UserId;
  createdAt: Date;
}>;

export type RecordComment = _RecordComment;

export const RecordComment = {
  /**
   * Create a new RecordComment entity.
   * @throws BusinessRuleError with CommentTextEmpty if text is empty
   * @throws BusinessRuleError with CommentTextTooLong if text exceeds 65,535 characters
   * @throws BusinessRuleError with TooManyMentions if mentions exceed 10
   */
  create: (params: {
    recordId: RecordIdType;
    appId: AppId;
    text: string;
    mentions: readonly Mention[];
    creatorId: UserId;
  }): WithEvents<_RecordComment, RecordEvent> => {
    if (params.text.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.CommentTextEmpty,
        "Comment text cannot be empty",
      );
    }
    if (params.text.length > MAX_COMMENT_TEXT_LENGTH) {
      throw new BusinessRuleError(
        RecordErrorCode.CommentTextTooLong,
        `Comment text cannot exceed ${MAX_COMMENT_TEXT_LENGTH} characters`,
      );
    }
    if (params.mentions.length > MAX_MENTIONS) {
      throw new BusinessRuleError(
        RecordErrorCode.TooManyMentions,
        `Cannot have more than ${MAX_MENTIONS} mentions`,
      );
    }

    const comment: _RecordComment = {
      commentId: CommentId.generate(),
      recordId: params.recordId,
      appId: params.appId,
      text: params.text,
      mentions: params.mentions,
      likes: new Set(),
      creatorId: params.creatorId,
      createdAt: new Date(),
    };

    return {
      entity: comment,
      events: [
        RecordEvents.commentAdded(
          comment.commentId,
          comment.recordId,
          comment.appId,
        ),
      ],
    };
  },

  /**
   * Reconstruct a RecordComment entity from persisted data.
   */
  reconstruct: (data: _RecordComment): _RecordComment => data,

  /**
   * Add a like to the comment. Idempotent (no-op if already liked).
   */
  addLike: (
    comment: _RecordComment,
    userId: UserId,
  ): WithEvents<_RecordComment, RecordEvent> => {
    if (comment.likes.has(userId)) {
      return { entity: comment, events: [] };
    }
    const newLikes = new Set(comment.likes);
    newLikes.add(userId);
    return {
      entity: {
        ...comment,
        likes: newLikes,
      },
      events: [],
    };
  },

  /**
   * Remove a like from the comment. Idempotent (no-op if not liked).
   */
  removeLike: (
    comment: _RecordComment,
    userId: UserId,
  ): WithEvents<_RecordComment, RecordEvent> => {
    if (!comment.likes.has(userId)) {
      return { entity: comment, events: [] };
    }
    const newLikes = new Set(comment.likes);
    newLikes.delete(userId);
    return {
      entity: {
        ...comment,
        likes: newLikes,
      },
      events: [],
    };
  },

  /**
   * Check if the comment was created by the specified user.
   */
  isOwnedBy: (comment: _RecordComment, userId: UserId): boolean => {
    return comment.creatorId === userId;
  },
};

// ============================================
// RecordHistory Entity
// ============================================

type _RecordHistory = Readonly<{
  historyId: HistoryIdType;
  recordId: RecordIdType;
  appId: AppId;
  version: number;
  changedFields: readonly FieldDiff[];
  modifierId: UserId;
  modifiedAt: Date;
}>;

export type RecordHistory = _RecordHistory;

export const RecordHistory = {
  /**
   * Create a new RecordHistory entry.
   * @throws BusinessRuleError with InvalidHistoryVersion if version is less than 1
   */
  create: (params: {
    recordId: RecordIdType;
    appId: AppId;
    version: number;
    changedFields: readonly FieldDiff[];
    modifierId: UserId;
  }): _RecordHistory => {
    if (params.version < 1) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidHistoryVersion,
        "History version must be at least 1",
      );
    }

    return {
      historyId: HistoryId.generate(),
      recordId: params.recordId,
      appId: params.appId,
      version: params.version,
      changedFields: params.changedFields,
      modifierId: params.modifierId,
      modifiedAt: new Date(),
    };
  },

  /**
   * Reconstruct a RecordHistory entity from persisted data.
   */
  reconstruct: (data: _RecordHistory): _RecordHistory => data,

  /**
   * Build a map of field values to restore from this history entry's diffs.
   * Restoration creates a new version; existing history is never modified.
   */
  buildRestoreValues: (
    history: _RecordHistory,
  ): ReadonlyMap<FieldCodeType, string> => {
    const values = new Map<FieldCodeType, string>();
    for (const diff of history.changedFields) {
      values.set(diff.fieldCode, diff.oldValue);
    }
    return values;
  },

  /**
   * Check if this version represents the initial record creation (version 1).
   */
  isInitialVersion: (history: _RecordHistory): boolean => {
    return history.version === 1;
  },
};

// ============================================
// CsvImportJob Entity
// ============================================

type _CsvImportJob = Readonly<{
  jobId: CsvImportJobIdType;
  appId: AppId;
  fileName: string;
  fileSize: number;
  encoding: CsvEncodingType;
  delimiter: CsvDelimiterType;
  importMode: ImportModeType;
  updateKey: FieldCodeType | null;
  errorHandling: ErrorHandlingType;
  fieldMappings: readonly FieldMappingType[];
  status: CsvImportJobStatusType;
  processedCount: number;
  errorCount: number;
  errorDetails: readonly CsvImportErrorType[];
  creatorId: UserId;
  createdAt: Date;
}>;

export type CsvImportJob = _CsvImportJob;

export const CsvImportJob = {
  /**
   * Create a new CsvImportJob entity.
   * @throws BusinessRuleError with UpdateKeyRequired if importMode is UPSERT and updateKey is null
   */
  create: (params: {
    appId: AppId;
    fileName: string;
    fileSize: number;
    encoding: CsvEncodingType;
    delimiter: CsvDelimiterType;
    importMode: ImportModeType;
    updateKey: FieldCodeType | null;
    errorHandling: ErrorHandlingType;
    fieldMappings: readonly FieldMappingType[];
    creatorId: UserId;
  }): WithEvents<_CsvImportJob, CsvImportJobEvent> => {
    if (params.importMode === "UPSERT" && params.updateKey === null) {
      throw new BusinessRuleError(
        RecordErrorCode.UpdateKeyRequired,
        "Update key is required for UPSERT import mode",
      );
    }

    const job: _CsvImportJob = {
      jobId: CsvImportJobId.generate(),
      appId: params.appId,
      fileName: params.fileName,
      fileSize: params.fileSize,
      encoding: params.encoding,
      delimiter: params.delimiter,
      importMode: params.importMode,
      updateKey: params.updateKey,
      errorHandling: params.errorHandling,
      fieldMappings: params.fieldMappings,
      status: CsvImportJobStatus.Pending,
      processedCount: 0,
      errorCount: 0,
      errorDetails: [],
      creatorId: params.creatorId,
      createdAt: new Date(),
    };

    return {
      entity: job,
      events: [],
    };
  },

  /**
   * Reconstruct a CsvImportJob entity from persisted data.
   */
  reconstruct: (data: _CsvImportJob): _CsvImportJob => data,

  /**
   * Start the import job.
   * @throws BusinessRuleError with InvalidJobState if status is not PENDING
   * @throws BusinessRuleError with FileSizeLimitExceeded if file exceeds size/row limits
   */
  start: (
    job: _CsvImportJob,
    isExcelFormat: boolean,
    rowCount: number,
  ): _CsvImportJob => {
    if (job.status !== CsvImportJobStatus.Pending) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidJobState,
        `Cannot start import job in ${job.status} state`,
      );
    }

    if (isExcelFormat) {
      if (job.fileSize > EXCEL_MAX_FILE_SIZE) {
        throw new BusinessRuleError(
          RecordErrorCode.FileSizeLimitExceeded,
          `Excel file size exceeds maximum of ${EXCEL_MAX_FILE_SIZE} bytes`,
        );
      }
      if (rowCount > EXCEL_MAX_ROWS) {
        throw new BusinessRuleError(
          RecordErrorCode.FileSizeLimitExceeded,
          `Excel file exceeds maximum of ${EXCEL_MAX_ROWS} rows`,
        );
      }
    } else {
      if (job.fileSize > CSV_MAX_FILE_SIZE) {
        throw new BusinessRuleError(
          RecordErrorCode.FileSizeLimitExceeded,
          `CSV file size exceeds maximum of ${CSV_MAX_FILE_SIZE} bytes`,
        );
      }
      if (rowCount > CSV_MAX_ROWS) {
        throw new BusinessRuleError(
          RecordErrorCode.FileSizeLimitExceeded,
          `CSV file exceeds maximum of ${CSV_MAX_ROWS} rows`,
        );
      }
    }

    return {
      ...job,
      status: CsvImportJobStatus.Processing,
    };
  },

  /**
   * Complete the import job successfully.
   * @throws BusinessRuleError with InvalidJobState if status is not PROCESSING
   */
  complete: (
    job: _CsvImportJob,
    processedCount: number,
    errorCount: number,
  ): _CsvImportJob => {
    if (job.status !== CsvImportJobStatus.Processing) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidJobState,
        `Cannot complete import job in ${job.status} state`,
      );
    }
    return {
      ...job,
      status: CsvImportJobStatus.Completed,
      processedCount,
      errorCount,
    };
  },

  /**
   * Mark the import job as failed.
   * @throws BusinessRuleError with InvalidJobState if status is not PROCESSING
   */
  fail: (job: _CsvImportJob, _reason: string): _CsvImportJob => {
    if (job.status !== CsvImportJobStatus.Processing) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidJobState,
        `Cannot fail import job in ${job.status} state`,
      );
    }
    return {
      ...job,
      status: CsvImportJobStatus.Failed,
    };
  },

  /**
   * Record an error that occurred during import processing.
   * If errorHandling is STOP, this also transitions the job to FAILED.
   */
  recordError: (
    job: _CsvImportJob,
    rowNumber: number,
    fieldCode: FieldCodeType,
    message: string,
  ): _CsvImportJob => {
    const newErrorDetails = [
      ...job.errorDetails,
      { rowNumber, fieldCode, message },
    ];
    const newErrorCount = job.errorCount + 1;

    if (job.errorHandling === "STOP") {
      return {
        ...job,
        errorDetails: newErrorDetails,
        errorCount: newErrorCount,
        status: CsvImportJobStatus.Failed,
      };
    }

    return {
      ...job,
      errorDetails: newErrorDetails,
      errorCount: newErrorCount,
    };
  },

  /**
   * Validate that the update key is set when required.
   * @throws BusinessRuleError with UpdateKeyRequired if importMode is UPSERT and updateKey is null
   */
  validateUpdateKey: (job: _CsvImportJob): void => {
    if (job.importMode === "UPSERT" && job.updateKey === null) {
      throw new BusinessRuleError(
        RecordErrorCode.UpdateKeyRequired,
        "Update key is required for UPSERT import mode",
      );
    }
  },
};

// ============================================
// CsvExportJob Entity
// ============================================

type _CsvExportJob = Readonly<{
  jobId: CsvExportJobIdType;
  appId: AppId;
  viewId: string | null;
  encoding: CsvEncodingType;
  delimiter: CsvDelimiterType;
  includeHeader: boolean;
  exportFields: readonly FieldCodeType[];
  includeComments: boolean;
  status: CsvExportJobStatusType;
  outputFileName: string | null;
  outputFileSize: number | null;
  creatorId: UserId;
  createdAt: Date;
  expiresAt: Date;
}>;

export type CsvExportJob = _CsvExportJob;

export const CsvExportJob = {
  /**
   * Create a new CsvExportJob entity.
   * expiresAt is automatically set to 3 days from creation.
   * @throws BusinessRuleError with NoFieldsSelected if exportFields is empty
   */
  create: (params: {
    appId: AppId;
    viewId: string | null;
    encoding: CsvEncodingType;
    delimiter: CsvDelimiterType;
    includeHeader: boolean;
    exportFields: readonly FieldCodeType[];
    includeComments: boolean;
    creatorId: UserId;
  }): WithEvents<_CsvExportJob, CsvExportJobEvent> => {
    if (params.exportFields.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.NoFieldsSelected,
        "At least one export field must be selected",
      );
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + EXPORT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const job: _CsvExportJob = {
      jobId: CsvExportJobId.generate(),
      appId: params.appId,
      viewId: params.viewId,
      encoding: params.encoding,
      delimiter: params.delimiter,
      includeHeader: params.includeHeader,
      exportFields: params.exportFields,
      includeComments: params.includeComments,
      status: CsvExportJobStatus.Pending,
      outputFileName: null,
      outputFileSize: null,
      creatorId: params.creatorId,
      createdAt: now,
      expiresAt,
    };

    return {
      entity: job,
      events: [],
    };
  },

  /**
   * Reconstruct a CsvExportJob entity from persisted data.
   */
  reconstruct: (data: _CsvExportJob): _CsvExportJob => data,

  /**
   * Start the export job.
   * @throws BusinessRuleError with InvalidJobState if status is not PENDING
   */
  start: (job: _CsvExportJob): _CsvExportJob => {
    if (job.status !== CsvExportJobStatus.Pending) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidJobState,
        `Cannot start export job in ${job.status} state`,
      );
    }
    return {
      ...job,
      status: CsvExportJobStatus.Processing,
    };
  },

  /**
   * Complete the export job successfully.
   * @throws BusinessRuleError with InvalidJobState if status is not PROCESSING
   */
  complete: (
    job: _CsvExportJob,
    fileName: string,
    fileSize: number,
  ): _CsvExportJob => {
    if (job.status !== CsvExportJobStatus.Processing) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidJobState,
        `Cannot complete export job in ${job.status} state`,
      );
    }
    return {
      ...job,
      status: CsvExportJobStatus.Completed,
      outputFileName: fileName,
      outputFileSize: fileSize,
    };
  },

  /**
   * Mark the export job as failed.
   * @throws BusinessRuleError with InvalidJobState if status is not PROCESSING
   */
  fail: (job: _CsvExportJob, _reason: string): _CsvExportJob => {
    if (job.status !== CsvExportJobStatus.Processing) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidJobState,
        `Cannot fail export job in ${job.status} state`,
      );
    }
    return {
      ...job,
      status: CsvExportJobStatus.Failed,
    };
  },

  /**
   * Check if the export file has expired (3 days after creation).
   */
  isExpired: (job: _CsvExportJob, now: Date): boolean => {
    return now >= job.expiresAt;
  },
};

// ============================================
// RecordCursor Entity
// ============================================

type _RecordCursor = Readonly<{
  cursorId: CursorIdType;
  appId: AppId;
  query: string | null;
  fields: readonly FieldCodeType[];
  size: number;
  totalCount: number;
  currentOffset: number;
  createdAt: Date;
  lastAccessedAt: Date;
}>;

export type RecordCursor = _RecordCursor;

export const RecordCursor = {
  /**
   * Create a new RecordCursor entity.
   * @throws BusinessRuleError with InvalidCursorSize if size is out of range [1, 500]
   */
  create: (params: {
    appId: AppId;
    query: string | null;
    fields: readonly FieldCodeType[];
    size?: number;
    totalCount: number;
  }): _RecordCursor => {
    const size = params.size ?? CURSOR_DEFAULT_SIZE;
    if (size < CURSOR_MIN_SIZE || size > CURSOR_MAX_SIZE) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidCursorSize,
        `Cursor size must be between ${CURSOR_MIN_SIZE} and ${CURSOR_MAX_SIZE}`,
      );
    }

    const now = new Date();
    return {
      cursorId: CursorId.generate(),
      appId: params.appId,
      query: params.query,
      fields: params.fields,
      size,
      totalCount: params.totalCount,
      currentOffset: 0,
      createdAt: now,
      lastAccessedAt: now,
    };
  },

  /**
   * Reconstruct a RecordCursor entity from persisted data.
   */
  reconstruct: (data: _RecordCursor): _RecordCursor => data,

  /**
   * Advance the cursor to the next batch of records.
   * @throws BusinessRuleError with CursorExpired if the cursor has expired
   */
  advance: (
    cursor: _RecordCursor,
    now: Date,
  ): {
    cursor: _RecordCursor;
    offset: number;
    size: number;
    hasNext: boolean;
  } => {
    if (RecordCursor.isExpired(cursor, now)) {
      throw new BusinessRuleError(
        RecordErrorCode.CursorExpired,
        "Cursor has expired",
      );
    }

    const offset = cursor.currentOffset;
    const remaining = cursor.totalCount - offset;
    const batchSize = Math.min(cursor.size, remaining);
    const newOffset = offset + batchSize;
    const hasNext = newOffset < cursor.totalCount;

    return {
      cursor: {
        ...cursor,
        currentOffset: newOffset,
        lastAccessedAt: now,
      },
      offset,
      size: batchSize,
      hasNext,
    };
  },

  /**
   * Check if the cursor has expired (10 minutes since last access).
   */
  isExpired: (cursor: _RecordCursor, now: Date): boolean => {
    const expiryTime = new Date(
      cursor.lastAccessedAt.getTime() + CURSOR_EXPIRY_MINUTES * 60 * 1000,
    );
    return now >= expiryTime;
  },

  /**
   * Update the last accessed timestamp to reset the expiry window.
   */
  touch: (cursor: _RecordCursor, now: Date): _RecordCursor => {
    return {
      ...cursor,
      lastAccessedAt: now,
    };
  },

  /**
   * Check if all records have been retrieved.
   */
  isCompleted: (cursor: _RecordCursor): boolean => {
    return cursor.currentOffset >= cursor.totalCount;
  },
};
