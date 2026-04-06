import { BusinessRuleError } from "@/core/domain/error";
import { FileErrorCode } from "./errorCode";

// ============================================
// FileKey
// ============================================

type _FileKey = string & { readonly brand: "FileKey" };

export type FileKey = _FileKey;

export const FileKey = {
  create: (key: string): _FileKey => {
    if (key.length === 0) {
      throw new BusinessRuleError(
        FileErrorCode.EmptyKey,
        "File key cannot be empty",
      );
    }
    return key as _FileKey;
  },
  equals: (a: _FileKey, b: _FileKey): boolean => {
    return a === b;
  },
};

// ============================================
// FileStatus
// ============================================

type _FileStatus = ("TEMPORARY" | "ATTACHED") & {
  readonly brand: "FileStatus";
};

export type FileStatus = _FileStatus;

export const FileStatus = {
  Temporary: "TEMPORARY" as _FileStatus,
  Attached: "ATTACHED" as _FileStatus,
  create: (status: string): _FileStatus => {
    if (status !== "TEMPORARY" && status !== "ATTACHED") {
      throw new BusinessRuleError(
        FileErrorCode.InvalidFileStatus,
        `Invalid file status: ${status}`,
      );
    }
    return status as _FileStatus;
  },
  isTemporary: (status: _FileStatus): status is "TEMPORARY" & _FileStatus =>
    (status as string) === "TEMPORARY",
  isAttached: (status: _FileStatus): status is "ATTACHED" & _FileStatus =>
    (status as string) === "ATTACHED",
};

// ============================================
// FileMetadata
// ============================================

type _FileMetadata = Readonly<{
  fileName: string;
  contentType: string;
  size: number;
}>;

export type FileMetadata = _FileMetadata;

export const FileMetadata = {
  create: (params: {
    fileName: string;
    contentType: string;
    size: number;
  }): _FileMetadata => {
    if (params.fileName.length === 0) {
      throw new BusinessRuleError(
        FileErrorCode.EmptyFileName,
        "File name cannot be empty",
      );
    }
    if (params.contentType.length === 0) {
      throw new BusinessRuleError(
        FileErrorCode.EmptyContentType,
        "Content type cannot be empty",
      );
    }
    if (params.size <= 0) {
      throw new BusinessRuleError(
        FileErrorCode.InvalidFileSize,
        "File size must be greater than 0",
      );
    }
    return {
      fileName: params.fileName,
      contentType: params.contentType,
      size: params.size,
    };
  },
};
