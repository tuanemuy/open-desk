import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import { FileErrorCode } from "./errorCode";
import type { FileEvent } from "./events";
import { FileEvents } from "./events";
import type {
  FileKey as FileKeyType,
  FileStatus as FileStatusType,
} from "./valueObject";
import { FileMetadata, FileStatus } from "./valueObject";

// ============================================
// Constants
// ============================================

/** Temporary file expiration duration in milliseconds (3 days). */
const TEMPORARY_EXPIRATION_MS = 3 * 24 * 60 * 60 * 1000;

// ============================================
// StoredFile Entity
// ============================================

type _StoredFile = Readonly<{
  fileKey: FileKeyType;
  fileName: string;
  contentType: string;
  size: number;
  uploaderId: UserIdType;
  status: FileStatusType;
  uploadedAt: Date;
  expiresAt: Date | null;
}>;

export type StoredFile = _StoredFile;

export const StoredFile = {
  /**
   * Create a new StoredFile entity in TEMPORARY status.
   * The file key is assigned externally (UUID format),
   * and expiresAt is set to uploadedAt + 3 days.
   */
  create: (params: {
    fileKey: FileKeyType;
    fileName: string;
    contentType: string;
    size: number;
    uploaderId: UserIdType;
  }): WithEvents<_StoredFile, FileEvent> => {
    const metadata = FileMetadata.create({
      fileName: params.fileName,
      contentType: params.contentType,
      size: params.size,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TEMPORARY_EXPIRATION_MS);

    const storedFile: _StoredFile = {
      fileKey: params.fileKey,
      fileName: metadata.fileName,
      contentType: metadata.contentType,
      size: metadata.size,
      uploaderId: params.uploaderId,
      status: FileStatus.Temporary,
      uploadedAt: now,
      expiresAt,
    };

    return {
      entity: storedFile,
      events: [FileEvents.uploaded(storedFile.fileKey, storedFile.uploaderId)],
    };
  },

  /**
   * Reconstruct a StoredFile entity from persisted data.
   */
  reconstruct: (data: _StoredFile): _StoredFile => data,

  /**
   * Attach the file to a record or other entity.
   * Changes status to ATTACHED, updates file key, and clears expiresAt.
   * @param file The stored file to attach
   * @param newFileKey The new file key in alphanumeric format
   * @throws BusinessRuleError if the file is already attached
   */
  attach: (
    file: _StoredFile,
    newFileKey: FileKeyType,
  ): WithEvents<_StoredFile, FileEvent> => {
    if (FileStatus.isAttached(file.status)) {
      throw new BusinessRuleError(
        FileErrorCode.AlreadyAttached,
        `File ${file.fileKey as string} is already attached`,
      );
    }

    const oldFileKey = file.fileKey;

    return {
      entity: {
        ...file,
        fileKey: newFileKey,
        status: FileStatus.Attached,
        expiresAt: null,
      },
      events: [FileEvents.attached(oldFileKey, newFileKey)],
    };
  },

  /**
   * Check whether the file's temporary expiration has passed.
   * ATTACHED files never expire.
   */
  isExpired: (file: _StoredFile, now: Date): boolean => {
    if (FileStatus.isAttached(file.status)) {
      return false;
    }
    if (file.expiresAt === null) {
      return false;
    }
    return now >= file.expiresAt;
  },

  /**
   * Check whether the file is in TEMPORARY status.
   */
  isTemporary: (file: _StoredFile): boolean => {
    return FileStatus.isTemporary(file.status);
  },

  /**
   * Check whether the file is in ATTACHED status.
   */
  isAttached: (file: _StoredFile): boolean => {
    return FileStatus.isAttached(file.status);
  },
};
