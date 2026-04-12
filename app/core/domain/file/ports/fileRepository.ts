import type { StoredFile } from "@/core/domain/file/entity";
import type { FileKey, FileStatus } from "@/core/domain/file/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";

export interface FileRepository {
  /**
   * Find a stored file by its file key.
   * @param fileKey The unique file identifier
   * @returns The stored file, or null if not found
   */
  findByKey(fileKey: FileKey): Promise<StoredFile | null>;

  /**
   * Find all files uploaded by a specific user.
   * @param uploaderId The uploader's user ID
   * @param status Optional status filter
   * @returns Array of stored files
   */
  findByUploaderId(
    uploaderId: UserId,
    status?: FileStatus,
  ): Promise<StoredFile[]>;

  /**
   * Save a stored file (create or update).
   * @param file The stored file to save
   */
  save(file: StoredFile): Promise<void>;

  /**
   * Delete a stored file by its file key.
   * @param fileKey The file key to delete
   */
  delete(fileKey: FileKey): Promise<void>;

  /**
   * Find all temporary files that have expired.
   * @param now The current time
   * @returns Array of expired stored files
   */
  findExpired(now: Date): Promise<StoredFile[]>;

  /**
   * Delete all expired temporary file records.
   * @param now The current time
   * @returns The number of deleted records
   */
  deleteExpired(now: Date): Promise<number>;

  /**
   * Get the total size of all stored files in bytes.
   * @returns The sum of all file sizes in bytes
   */
  getTotalSize(): Promise<number>;
}
