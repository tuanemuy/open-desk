import type { FileStorageProvider } from "@/core/domain/file/ports/fileStorageProvider";
import type { FileKey, FileMetadata } from "@/core/domain/file/valueObject";
import { StubNotImplementedError } from "./error";

export class StubFileStorageProvider implements FileStorageProvider {
  upload(
    _fileKey: FileKey,
    _data: ReadableStream,
    _metadata: FileMetadata,
  ): Promise<void> {
    throw new StubNotImplementedError("FileStorageProvider");
  }

  download(
    _fileKey: FileKey,
  ): Promise<{ data: ReadableStream; metadata: FileMetadata }> {
    throw new StubNotImplementedError("FileStorageProvider");
  }

  delete(_fileKey: FileKey): Promise<void> {
    throw new StubNotImplementedError("FileStorageProvider");
  }

  deleteBatch(_fileKeys: FileKey[]): Promise<number> {
    throw new StubNotImplementedError("FileStorageProvider");
  }
}
