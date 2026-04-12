import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  type ObjectIdentifier,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { FileStorageProvider } from "@/core/domain/file/ports/fileStorageProvider";
import type { FileKey, FileMetadata } from "@/core/domain/file/valueObject";
import { FileMetadata as FileMetadataVO } from "@/core/domain/file/valueObject";

/**
 * Configuration for the Cloudflare R2 file storage provider.
 */
export type R2Config = Readonly<{
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}>;

/**
 * Cloudflare R2 (S3-compatible) implementation of FileStorageProvider.
 *
 * Uses @aws-sdk/client-s3 to interact with R2's S3-compatible API.
 * File metadata (fileName, contentType, size) is stored as object metadata
 * so it can be retrieved on download without a separate database lookup.
 */
export class R2FileStorageProvider implements FileStorageProvider {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(
    fileKey: FileKey,
    data: ReadableStream,
    metadata: FileMetadata,
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey as string,
        Body: data,
        ContentType: metadata.contentType,
        ContentLength: metadata.size,
        Metadata: {
          filename: metadata.fileName,
          contenttype: metadata.contentType,
          size: String(metadata.size),
        },
      });

      await this.client.send(command);
    } catch (error: unknown) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        `Failed to upload file: ${fileKey as string}`,
        error,
      );
    }
  }

  async download(
    fileKey: FileKey,
  ): Promise<{ data: ReadableStream; metadata: FileMetadata }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey as string,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new SystemError(
          SystemErrorCode.StorageError,
          `Empty response body for file: ${fileKey as string}`,
        );
      }

      const fileName = response.Metadata?.filename ?? "unknown";
      const contentType =
        response.Metadata?.contenttype ??
        response.ContentType ??
        "application/octet-stream";
      const size = Number(
        response.Metadata?.size ?? response.ContentLength ?? 0,
      );

      const metadata = FileMetadataVO.create({
        fileName,
        contentType,
        size,
      });

      const data = response.Body.transformToWebStream() as ReadableStream;

      return { data, metadata };
    } catch (error: unknown) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        `Failed to download file: ${fileKey as string}`,
        error,
      );
    }
  }

  async delete(fileKey: FileKey): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey as string,
      });

      await this.client.send(command);
    } catch (error: unknown) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        `Failed to delete file: ${fileKey as string}`,
        error,
      );
    }
  }

  async deleteBatch(fileKeys: FileKey[]): Promise<number> {
    if (fileKeys.length === 0) {
      return 0;
    }

    try {
      const objects: ObjectIdentifier[] = fileKeys.map((key) => ({
        Key: key as string,
      }));

      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: objects,
          Quiet: false,
        },
      });

      const response = await this.client.send(command);
      return response.Deleted?.length ?? 0;
    } catch (error: unknown) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        `Failed to batch delete ${String(fileKeys.length)} files`,
        error,
      );
    }
  }
}
