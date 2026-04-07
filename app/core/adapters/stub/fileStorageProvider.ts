import type { FileStorageProvider } from "@/core/domain/file/ports/fileStorageProvider";
import type { FileKey, FileMetadata } from "@/core/domain/file/valueObject";

export class StubFileStorageProvider implements FileStorageProvider {
  upload(
    _fileKey: FileKey,
    _data: ReadableStream,
    _metadata: FileMetadata,
  ): Promise<void> {
    throw new Error("Not implemented");
  }

  download(
    _fileKey: FileKey,
  ): Promise<{ data: ReadableStream; metadata: FileMetadata }> {
    throw new Error("Not implemented");
  }

  delete(_fileKey: FileKey): Promise<void> {
    throw new Error("Not implemented");
  }

  deleteBatch(_fileKeys: FileKey[]): Promise<number> {
    throw new Error("Not implemented");
  }
}
