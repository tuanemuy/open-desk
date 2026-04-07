import type {
  FieldCode,
  FieldDiff,
  FieldValue,
  Mention,
} from "@/core/domain/record/valueObject";

// ============================================
// Record DTOs
// ============================================

export type RecordDto = {
  readonly recordId: string;
  readonly appId: string;
  readonly revision: number;
  readonly fieldValues: ReadonlyMap<FieldCode, FieldValue>;
  readonly status: string | null;
  readonly statusAssignees: readonly string[];
  readonly creatorId: string;
  readonly createdAt: Date;
  readonly modifierId: string;
  readonly updatedAt: Date;
};

export type CreateRecordOutput = {
  readonly recordId: string;
  readonly revision: number;
};

export type BulkCreateRecordOutput = {
  readonly ids: readonly string[];
  readonly revisions: readonly number[];
};

export type GetRecordOutput = {
  readonly record: RecordDto;
};

export type QueryRecordOutput = {
  readonly records: readonly RecordDto[];
  readonly totalCount: number | null;
};

export type UpdateRecordOutput = {
  readonly revision: number;
};

export type BulkUpdateRecordOutput = {
  readonly records: readonly {
    readonly recordId: string;
    readonly revision: number;
  }[];
};

export type ReuseRecordOutput = {
  readonly fieldValues: ReadonlyMap<FieldCode, FieldValue>;
};

export type ChangeStatusOutput = {
  readonly revision: number;
};

export type BulkChangeStatusOutput = {
  readonly records: readonly {
    readonly recordId: string;
    readonly revision: number;
  }[];
};

export type UpdateAssigneesOutput = {
  readonly revision: number;
};

export type PostCommentOutput = {
  readonly commentId: string;
};

export type RecordCommentDto = {
  readonly commentId: string;
  readonly recordId: string;
  readonly appId: string;
  readonly text: string;
  readonly mentions: readonly Mention[];
  readonly likes: readonly string[];
  readonly creatorId: string;
  readonly createdAt: Date;
};

export type GetCommentsOutput = {
  readonly comments: readonly RecordCommentDto[];
  readonly older: boolean;
  readonly newer: boolean;
};

export type RecordHistoryDto = {
  readonly historyId: string;
  readonly recordId: string;
  readonly appId: string;
  readonly version: number;
  readonly changedFields: readonly FieldDiff[];
  readonly modifierId: string;
  readonly modifiedAt: Date;
};

export type GetHistoryOutput = {
  readonly histories: readonly RecordHistoryDto[];
};

export type RestoreRecordOutput = {
  readonly revision: number;
};

export type CsvImportOutput = {
  readonly jobId: string;
};

export type CsvExportOutput = {
  readonly jobId: string;
};

export type ExportFileDownloadOutput = {
  readonly fileName: string;
  readonly fileContent: ArrayBuffer;
  readonly contentType: string;
};

export type CreateCursorOutput = {
  readonly cursorId: string;
  readonly totalCount: number;
};

export type GetCursorRecordsOutput = {
  readonly records: readonly RecordDto[];
  readonly next: boolean;
};
