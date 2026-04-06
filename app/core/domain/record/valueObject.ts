import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { RecordErrorCode } from "./errorCode";

// ============================================
// RecordId
// ============================================

type _RecordId = string & { readonly brand: "RecordId" };

export type RecordId = _RecordId;

export const RecordId = {
  create: (id: string): _RecordId => {
    if (id.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.EmptyRecordId,
        "Record ID cannot be empty",
      );
    }
    return id as _RecordId;
  },
  generate: (): _RecordId => {
    return uuidv7() as _RecordId;
  },
};

// ============================================
// CommentId
// ============================================

type _CommentId = string & { readonly brand: "CommentId" };

export type CommentId = _CommentId;

export const CommentId = {
  create: (id: string): _CommentId => {
    if (id.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.EmptyCommentId,
        "Comment ID cannot be empty",
      );
    }
    return id as _CommentId;
  },
  generate: (): _CommentId => {
    return uuidv7() as _CommentId;
  },
};

// ============================================
// HistoryId
// ============================================

type _HistoryId = string & { readonly brand: "HistoryId" };

export type HistoryId = _HistoryId;

export const HistoryId = {
  create: (id: string): _HistoryId => {
    if (id.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.EmptyHistoryId,
        "History ID cannot be empty",
      );
    }
    return id as _HistoryId;
  },
  generate: (): _HistoryId => {
    return uuidv7() as _HistoryId;
  },
};

// ============================================
// CsvImportJobId
// ============================================

type _CsvImportJobId = string & { readonly brand: "CsvImportJobId" };

export type CsvImportJobId = _CsvImportJobId;

export const CsvImportJobId = {
  create: (id: string): _CsvImportJobId => {
    if (id.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.EmptyCsvImportJobId,
        "CSV import job ID cannot be empty",
      );
    }
    return id as _CsvImportJobId;
  },
  generate: (): _CsvImportJobId => {
    return uuidv7() as _CsvImportJobId;
  },
};

// ============================================
// CsvExportJobId
// ============================================

type _CsvExportJobId = string & { readonly brand: "CsvExportJobId" };

export type CsvExportJobId = _CsvExportJobId;

export const CsvExportJobId = {
  create: (id: string): _CsvExportJobId => {
    if (id.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.EmptyCsvExportJobId,
        "CSV export job ID cannot be empty",
      );
    }
    return id as _CsvExportJobId;
  },
  generate: (): _CsvExportJobId => {
    return uuidv7() as _CsvExportJobId;
  },
};

// ============================================
// CursorId
// ============================================

type _CursorId = string & { readonly brand: "CursorId" };

export type CursorId = _CursorId;

export const CursorId = {
  create: (id: string): _CursorId => {
    if (id.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.EmptyCursorId,
        "Cursor ID cannot be empty",
      );
    }
    return id as _CursorId;
  },
  generate: (): _CursorId => {
    return uuidv7() as _CursorId;
  },
};

// ============================================
// FieldCode
// ============================================

type _FieldCode = string & { readonly brand: "FieldCode" };

export type FieldCode = _FieldCode;

export const FieldCode = {
  create: (value: string): _FieldCode => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        RecordErrorCode.EmptyFieldCode,
        "Field code cannot be empty",
      );
    }
    return value as _FieldCode;
  },
};

// ============================================
// FieldType
// ============================================

const FIELD_TYPES = [
  "SINGLE_LINE_TEXT",
  "MULTI_LINE_TEXT",
  "RICH_TEXT",
  "NUMBER",
  "CALC",
  "CHECK_BOX",
  "RADIO_BUTTON",
  "MULTI_SELECT",
  "DROP_DOWN",
  "USER_SELECT",
  "ORGANIZATION_SELECT",
  "GROUP_SELECT",
  "DATE",
  "TIME",
  "DATETIME",
  "LINK",
  "FILE",
  "SUBTABLE",
  "RECORD_NUMBER",
  "CATEGORY",
  "STATUS",
  "STATUS_ASSIGNEE",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME",
  "LOOKUP",
  "REFERENCE_TABLE",
  "__ID__",
  "__REVISION__",
] as const;

type _FieldType = (typeof FIELD_TYPES)[number];

export type FieldType = _FieldType;

/**
 * Field types that cannot be updated via the record update API.
 * These are read-only or managed by other subsystems.
 */
const READ_ONLY_FIELD_TYPES: readonly _FieldType[] = [
  "LOOKUP",
  "STATUS",
  "CATEGORY",
  "CALC",
  "STATUS_ASSIGNEE",
  "RECORD_NUMBER",
  "MODIFIER",
  "UPDATED_TIME",
  "REFERENCE_TABLE",
  "__ID__",
  "__REVISION__",
];

/**
 * Field types that can only be set at record creation time.
 * Attempts to update these fields after creation will be rejected.
 */
const CREATE_ONLY_FIELD_TYPES: readonly _FieldType[] = [
  "CREATOR",
  "CREATED_TIME",
];

/**
 * System field types that should not be copied during record reuse.
 */
const SYSTEM_FIELD_TYPES: readonly _FieldType[] = [
  "RECORD_NUMBER",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME",
  "STATUS",
  "STATUS_ASSIGNEE",
  "CALC",
  "__ID__",
  "__REVISION__",
];

export const FieldType = {
  create: (value: string): _FieldType => {
    if (!FIELD_TYPES.includes(value as _FieldType)) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidFieldType,
        `Invalid field type: ${value}`,
      );
    }
    return value as _FieldType;
  },
  isReadOnly: (fieldType: _FieldType): boolean =>
    READ_ONLY_FIELD_TYPES.includes(fieldType),
  isCreateOnly: (fieldType: _FieldType): boolean =>
    CREATE_ONLY_FIELD_TYPES.includes(fieldType),
  isSystemField: (fieldType: _FieldType): boolean =>
    SYSTEM_FIELD_TYPES.includes(fieldType),
  validValues: FIELD_TYPES,
};

// ============================================
// FieldValue (union type)
// ============================================

/** User reference in user select, creator, modifier fields */
export type UserReference = Readonly<{
  code: string;
  name: string;
}>;

/** Organization reference in organization select fields */
export type OrganizationReference = Readonly<{
  code: string;
  name: string;
}>;

/** Group reference in group select fields */
export type GroupReference = Readonly<{
  code: string;
  name: string;
}>;

/** File reference in file attachment fields */
export type FileReference = Readonly<{
  fileKey: string;
  name: string;
  contentType: string;
  size: number;
}>;

/**
 * A single row in a subtable field.
 * When updating, all existing rows must be included (omitted rows are deleted).
 * A null rowId indicates a new row to be added.
 */
export type SubtableRow = Readonly<{
  rowId: string | null;
  fields: ReadonlyMap<_FieldCode, FieldValue>;
}>;

// Individual field value types

export type SingleLineTextFieldValue = Readonly<{
  type: "SINGLE_LINE_TEXT";
  value: string;
}>;

export type MultiLineTextFieldValue = Readonly<{
  type: "MULTI_LINE_TEXT";
  value: string;
}>;

export type RichTextFieldValue = Readonly<{
  type: "RICH_TEXT";
  value: string;
}>;

export type NumberFieldValue = Readonly<{
  type: "NUMBER";
  value: string;
}>;

export type CalcFieldValue = Readonly<{
  type: "CALC";
  value: string;
}>;

export type CheckBoxFieldValue = Readonly<{
  type: "CHECK_BOX";
  value: readonly string[];
}>;

export type RadioButtonFieldValue = Readonly<{
  type: "RADIO_BUTTON";
  value: string;
}>;

export type MultiSelectFieldValue = Readonly<{
  type: "MULTI_SELECT";
  value: readonly string[];
}>;

export type DropDownFieldValue = Readonly<{
  type: "DROP_DOWN";
  value: string;
}>;

export type UserSelectFieldValue = Readonly<{
  type: "USER_SELECT";
  value: readonly UserReference[];
}>;

export type OrganizationSelectFieldValue = Readonly<{
  type: "ORGANIZATION_SELECT";
  value: readonly OrganizationReference[];
}>;

export type GroupSelectFieldValue = Readonly<{
  type: "GROUP_SELECT";
  value: readonly GroupReference[];
}>;

export type DateFieldValue = Readonly<{
  type: "DATE";
  value: string | null;
}>;

export type TimeFieldValue = Readonly<{
  type: "TIME";
  value: string | null;
}>;

export type DateTimeFieldValue = Readonly<{
  type: "DATETIME";
  value: string | null;
}>;

export type LinkFieldValue = Readonly<{
  type: "LINK";
  value: string;
}>;

export type FileFieldValue = Readonly<{
  type: "FILE";
  value: readonly FileReference[];
}>;

export type SubtableFieldValue = Readonly<{
  type: "SUBTABLE";
  value: readonly SubtableRow[];
}>;

export type RecordNumberFieldValue = Readonly<{
  type: "RECORD_NUMBER";
  value: string;
}>;

export type CategoryFieldValue = Readonly<{
  type: "CATEGORY";
  value: readonly string[];
}>;

export type StatusFieldValue = Readonly<{
  type: "STATUS";
  value: string;
}>;

export type StatusAssigneeFieldValue = Readonly<{
  type: "STATUS_ASSIGNEE";
  value: readonly UserReference[];
}>;

export type CreatorFieldValue = Readonly<{
  type: "CREATOR";
  value: UserReference;
}>;

export type CreatedTimeFieldValue = Readonly<{
  type: "CREATED_TIME";
  value: string;
}>;

export type ModifierFieldValue = Readonly<{
  type: "MODIFIER";
  value: UserReference;
}>;

export type UpdatedTimeFieldValue = Readonly<{
  type: "UPDATED_TIME";
  value: string;
}>;

/**
 * Lookup field value. The underlying value type depends on the key field's type.
 * It can be a single string (text, number, etc.) or an array (checkbox, multi-select).
 */
export type LookupFieldValue = Readonly<{
  type: "LOOKUP";
  value: string | readonly string[];
}>;

/**
 * Reference table field value.
 * Contains an array of referenced records with their field values (read-only).
 */
export type ReferenceTableFieldValue = Readonly<{
  type: "REFERENCE_TABLE";
  value: readonly ReferenceTableRecord[];
}>;

export type ReferenceTableRecord = Readonly<{
  recordId: _RecordId;
  fieldValues: ReadonlyMap<_FieldCode, FieldValue>;
}>;

/** Internal ID field (read-only system field) */
export type IdFieldValue = Readonly<{
  type: "__ID__";
  value: string;
}>;

/** Internal revision field (read-only system field) */
export type RevisionFieldValue = Readonly<{
  type: "__REVISION__";
  value: string;
}>;

/** Union of all field value types */
export type FieldValue =
  | SingleLineTextFieldValue
  | MultiLineTextFieldValue
  | RichTextFieldValue
  | NumberFieldValue
  | CalcFieldValue
  | CheckBoxFieldValue
  | RadioButtonFieldValue
  | MultiSelectFieldValue
  | DropDownFieldValue
  | UserSelectFieldValue
  | OrganizationSelectFieldValue
  | GroupSelectFieldValue
  | DateFieldValue
  | TimeFieldValue
  | DateTimeFieldValue
  | LinkFieldValue
  | FileFieldValue
  | SubtableFieldValue
  | RecordNumberFieldValue
  | CategoryFieldValue
  | StatusFieldValue
  | StatusAssigneeFieldValue
  | CreatorFieldValue
  | CreatedTimeFieldValue
  | ModifierFieldValue
  | UpdatedTimeFieldValue
  | LookupFieldValue
  | ReferenceTableFieldValue
  | IdFieldValue
  | RevisionFieldValue;

// ============================================
// FieldDiff
// ============================================

/**
 * Represents a character-level diff for a single field in the change history.
 */
export type FieldDiff = Readonly<{
  fieldCode: _FieldCode;
  oldValue: string;
  newValue: string;
}>;

// ============================================
// Mention
// ============================================

const MENTION_TYPES = ["USER", "GROUP", "ORGANIZATION"] as const;

type _MentionType = (typeof MENTION_TYPES)[number];

export type MentionType = _MentionType;

export type Mention = Readonly<{
  type: _MentionType;
  code: string;
}>;

export const MentionType = {
  create: (value: string): _MentionType => {
    if (!MENTION_TYPES.includes(value as _MentionType)) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidMentionType,
        `Invalid mention type: ${value}`,
      );
    }
    return value as _MentionType;
  },
};

// ============================================
// ProcessStatus
// ============================================

type _ProcessStatus = string & { readonly brand: "ProcessStatus" };

export type ProcessStatus = _ProcessStatus;

export const ProcessStatus = {
  create: (value: string): _ProcessStatus => {
    return value as _ProcessStatus;
  },
};

// ============================================
// RecordQuery
// ============================================

const SORT_DIRECTIONS = ["asc", "desc"] as const;

type _SortDirection = (typeof SORT_DIRECTIONS)[number];

export type SortDirection = _SortDirection;

export const SortDirection = {
  create: (value: string): _SortDirection => {
    if (!SORT_DIRECTIONS.includes(value as _SortDirection)) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidSortDirection,
        `Invalid sort direction: ${value}`,
      );
    }
    return value as _SortDirection;
  },
};

export type SortSpec = Readonly<{
  fieldCode: _FieldCode;
  direction: _SortDirection;
}>;

export type RecordQuery = Readonly<{
  condition: string | null;
  orderBy: readonly SortSpec[];
  limit: number | null;
  offset: number | null;
}>;

// ============================================
// FieldMapping
// ============================================

export type FieldMapping = Readonly<{
  appFieldCode: _FieldCode;
  fileColumn: string;
  dateFormat: string | null;
}>;

// ============================================
// CsvImportError
// ============================================

export type CsvImportError = Readonly<{
  rowNumber: number;
  fieldCode: _FieldCode;
  message: string;
}>;

// ============================================
// ImportMode
// ============================================

const IMPORT_MODES = ["ADD_ONLY", "UPSERT"] as const;

type _ImportMode = (typeof IMPORT_MODES)[number];

export type ImportMode = _ImportMode;

export const ImportMode = {
  AddOnly: "ADD_ONLY" as _ImportMode,
  Upsert: "UPSERT" as _ImportMode,
  create: (value: string): _ImportMode => {
    if (!IMPORT_MODES.includes(value as _ImportMode)) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidImportMode,
        `Invalid import mode: ${value}`,
      );
    }
    return value as _ImportMode;
  },
};

// ============================================
// ErrorHandling
// ============================================

const ERROR_HANDLING_MODES = ["CONTINUE", "STOP"] as const;

type _ErrorHandling = (typeof ERROR_HANDLING_MODES)[number];

export type ErrorHandling = _ErrorHandling;

export const ErrorHandling = {
  Continue: "CONTINUE" as _ErrorHandling,
  Stop: "STOP" as _ErrorHandling,
  create: (value: string): _ErrorHandling => {
    if (!ERROR_HANDLING_MODES.includes(value as _ErrorHandling)) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidErrorHandling,
        `Invalid error handling mode: ${value}`,
      );
    }
    return value as _ErrorHandling;
  },
};

// ============================================
// CsvEncoding
// ============================================

const CSV_ENCODINGS = [
  "SHIFT_JIS",
  "LATIN1",
  "GBK",
  "UTF8",
  "UTF8_BOM",
] as const;

type _CsvEncoding = (typeof CSV_ENCODINGS)[number];

export type CsvEncoding = _CsvEncoding;

export const CsvEncoding = {
  create: (value: string): _CsvEncoding => {
    if (!CSV_ENCODINGS.includes(value as _CsvEncoding)) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidCsvEncoding,
        `Invalid CSV encoding: ${value}`,
      );
    }
    return value as _CsvEncoding;
  },
  validValues: CSV_ENCODINGS,
};

// ============================================
// CsvDelimiter
// ============================================

const CSV_DELIMITERS = ["COMMA", "SEMICOLON", "TAB", "SPACE"] as const;

type _CsvDelimiter = (typeof CSV_DELIMITERS)[number];

export type CsvDelimiter = _CsvDelimiter;

export const CsvDelimiter = {
  create: (value: string): _CsvDelimiter => {
    if (!CSV_DELIMITERS.includes(value as _CsvDelimiter)) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidCsvDelimiter,
        `Invalid CSV delimiter: ${value}`,
      );
    }
    return value as _CsvDelimiter;
  },
  validValues: CSV_DELIMITERS,
};

// ============================================
// CsvImportJobStatus
// ============================================

const CSV_IMPORT_JOB_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

type _CsvImportJobStatus = (typeof CSV_IMPORT_JOB_STATUSES)[number];

export type CsvImportJobStatus = _CsvImportJobStatus;

export const CsvImportJobStatus = {
  Pending: "PENDING" as _CsvImportJobStatus,
  Processing: "PROCESSING" as _CsvImportJobStatus,
  Completed: "COMPLETED" as _CsvImportJobStatus,
  Failed: "FAILED" as _CsvImportJobStatus,
  create: (value: string): _CsvImportJobStatus => {
    if (!CSV_IMPORT_JOB_STATUSES.includes(value as _CsvImportJobStatus)) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidJobState,
        `Invalid CSV import job status: ${value}`,
      );
    }
    return value as _CsvImportJobStatus;
  },
};

// ============================================
// CsvExportJobStatus
// ============================================

const CSV_EXPORT_JOB_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

type _CsvExportJobStatus = (typeof CSV_EXPORT_JOB_STATUSES)[number];

export type CsvExportJobStatus = _CsvExportJobStatus;

export const CsvExportJobStatus = {
  Pending: "PENDING" as _CsvExportJobStatus,
  Processing: "PROCESSING" as _CsvExportJobStatus,
  Completed: "COMPLETED" as _CsvExportJobStatus,
  Failed: "FAILED" as _CsvExportJobStatus,
  create: (value: string): _CsvExportJobStatus => {
    if (!CSV_EXPORT_JOB_STATUSES.includes(value as _CsvExportJobStatus)) {
      throw new BusinessRuleError(
        RecordErrorCode.InvalidJobState,
        `Invalid CSV export job status: ${value}`,
      );
    }
    return value as _CsvExportJobStatus;
  },
};

// ============================================
// QueryExecutionContext
// ============================================

export type QueryExecutionContext = Readonly<{
  loginUserId: string;
  loginUserCode: string;
  primaryOrganizationCode: string | null;
  now: Date;
}>;
