import type { FileKey, FileStatus } from "@/core/domain/file/valueObject";

export type UploadFileOutput = {
  fileKey: FileKey;
  fileName: string;
  contentType: string;
  size: number;
  status: FileStatus;
  uploadedAt: Date;
  expiresAt: Date;
};

export type DownloadFileOutput = {
  data: ReadableStream;
  fileName: string;
  contentType: string;
  size: number;
};

export type CleanupExpiredFilesOutput = {
  deletedCount: number;
};
