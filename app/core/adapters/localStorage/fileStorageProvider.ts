import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { FileStorageProvider } from "@/core/domain/file/ports/fileStorageProvider";
import {
  type FileKey,
  FileMetadata,
  type FileMetadata as FileMetadataType,
} from "@/core/domain/file/valueObject";

export type LocalStorageConfig = {
  /** Base directory for file storage (absolute path) */
  basePath: string;
};

export class LocalFileStorageProvider implements FileStorageProvider {
  private readonly basePath: string;

  constructor(config: LocalStorageConfig) {
    this.basePath = config.basePath;
  }

  async upload(
    fileKey: FileKey,
    data: ReadableStream,
    metadata: FileMetadataType,
  ): Promise<void> {
    try {
      const filePath = this.resolveFilePath(fileKey);
      const metaPath = this.resolveMetaPath(fileKey);

      await mkdir(dirname(filePath), { recursive: true });

      const chunks: Uint8Array[] = [];
      const reader = data.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks);

      await writeFile(filePath, buffer);
      await writeFile(
        metaPath,
        JSON.stringify({
          fileName: metadata.fileName,
          contentType: metadata.contentType,
          size: metadata.size,
        }),
      );
    } catch (error) {
      if (error instanceof SystemError) throw error;
      throw new SystemError(
        SystemErrorCode.StorageError,
        `Failed to upload file: ${fileKey}`,
        error,
      );
    }
  }

  async download(
    fileKey: FileKey,
  ): Promise<{ data: ReadableStream; metadata: FileMetadataType }> {
    try {
      const filePath = this.resolveFilePath(fileKey);
      const metaPath = this.resolveMetaPath(fileKey);

      const [fileBuffer, metaBuffer] = await Promise.all([
        readFile(filePath),
        readFile(metaPath, "utf-8"),
      ]);

      const metaJson = JSON.parse(metaBuffer) as {
        fileName: string;
        contentType: string;
        size: number;
      };
      const metadata = FileMetadata.create({
        fileName: metaJson.fileName,
        contentType: metaJson.contentType,
        size: metaJson.size,
      });

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(fileBuffer));
          controller.close();
        },
      });

      return { data: stream, metadata };
    } catch (error) {
      if (error instanceof SystemError) throw error;
      throw new SystemError(
        SystemErrorCode.StorageError,
        `Failed to download file: ${fileKey}`,
        error,
      );
    }
  }

  async delete(fileKey: FileKey): Promise<void> {
    try {
      const filePath = this.resolveFilePath(fileKey);
      const metaPath = this.resolveMetaPath(fileKey);

      await rm(filePath, { force: true });
      await rm(metaPath, { force: true });
    } catch (error) {
      if (error instanceof SystemError) throw error;
      throw new SystemError(
        SystemErrorCode.StorageError,
        `Failed to delete file: ${fileKey}`,
        error,
      );
    }
  }

  async deleteBatch(fileKeys: FileKey[]): Promise<number> {
    let deleted = 0;
    for (const key of fileKeys) {
      try {
        const filePath = this.resolveFilePath(key);
        await stat(filePath);
        await this.delete(key);
        deleted++;
      } catch {
        // File doesn't exist — skip
      }
    }
    return deleted;
  }

  private resolveFilePath(fileKey: FileKey): string {
    return join(this.basePath, "files", fileKey as string);
  }

  private resolveMetaPath(fileKey: FileKey): string {
    return join(this.basePath, "meta", `${fileKey as string}.json`);
  }
}
