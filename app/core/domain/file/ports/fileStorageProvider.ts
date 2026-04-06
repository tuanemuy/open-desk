import type { FileKey, FileMetadata } from "@/core/domain/file/valueObject";

export interface FileStorageProvider {
  /**
   * Upload a file to storage.
   * @param fileKey The unique file identifier
   * @param data The file binary data as a readable stream
   * @param metadata The file metadata (name, content type, size)
   */
  upload(
    fileKey: FileKey,
    data: ReadableStream,
    metadata: FileMetadata,
  ): Promise<void>;

  /**
   * Download a file from storage.
   * @param fileKey The unique file identifier
   * @returns The file binary data and metadata
   */
  download(fileKey: FileKey): Promise<{
    data: ReadableStream;
    metadata: FileMetadata;
  }>;

  /**
   * Delete a file from storage.
   * @param fileKey The file key to delete
   */
  delete(fileKey: FileKey): Promise<void>;

  /**
   * Delete multiple files from storage in batch.
   * @param fileKeys Array of file keys to delete
   * @returns The number of successfully deleted files
   */
  deleteBatch(fileKeys: FileKey[]): Promise<number>;
}
