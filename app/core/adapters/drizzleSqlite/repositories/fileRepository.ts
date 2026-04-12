import type { InferSelectModel } from "drizzle-orm";
import { and, eq, lt, sql } from "drizzle-orm";
import { storedFiles } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { StoredFile } from "@/core/domain/file/entity";
import type { FileRepository } from "@/core/domain/file/ports/fileRepository";
import type {
  FileKey as FileKeyType,
  FileStatus as FileStatusType,
} from "@/core/domain/file/valueObject";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type StoredFileDataModel = InferSelectModel<typeof storedFiles>;

export class DrizzleSqliteFileRepository implements FileRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: StoredFileDataModel): StoredFile {
    return {
      fileKey: data.fileKey as FileKeyType,
      fileName: data.fileName,
      contentType: data.contentType,
      size: data.size,
      uploaderId: data.uploaderId as UserIdType,
      status: data.status as FileStatusType,
      uploadedAt: data.uploadedAt,
      expiresAt: data.expiresAt,
    };
  }

  async findByKey(fileKey: FileKeyType): Promise<StoredFile | null> {
    try {
      const results = await this.executor
        .select()
        .from(storedFiles)
        .where(eq(storedFiles.fileKey, fileKey))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find file by key",
        error,
      );
    }
  }

  async findByUploaderId(
    uploaderId: UserIdType,
    status?: FileStatusType,
  ): Promise<StoredFile[]> {
    try {
      const conditions = [eq(storedFiles.uploaderId, uploaderId)];

      if (status !== undefined) {
        conditions.push(eq(storedFiles.status, status));
      }

      const results = await this.executor
        .select()
        .from(storedFiles)
        .where(and(...conditions));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find files by uploader id",
        error,
      );
    }
  }

  async save(file: StoredFile): Promise<void> {
    try {
      await this.executor
        .insert(storedFiles)
        .values({
          fileKey: file.fileKey,
          fileName: file.fileName,
          contentType: file.contentType,
          size: file.size,
          uploaderId: file.uploaderId,
          status: file.status,
          uploadedAt: file.uploadedAt,
          expiresAt: file.expiresAt,
        })
        .onConflictDoUpdate({
          target: storedFiles.fileKey,
          set: {
            fileName: file.fileName,
            contentType: file.contentType,
            size: file.size,
            status: file.status,
            expiresAt: file.expiresAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save file",
        error,
      );
    }
  }

  async delete(fileKey: FileKeyType): Promise<void> {
    try {
      await this.executor
        .delete(storedFiles)
        .where(eq(storedFiles.fileKey, fileKey));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete file",
        error,
      );
    }
  }

  async findExpired(now: Date): Promise<StoredFile[]> {
    try {
      const results = await this.executor
        .select()
        .from(storedFiles)
        .where(
          and(
            eq(storedFiles.status, "TEMPORARY"),
            lt(storedFiles.expiresAt, now),
          ),
        );

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find expired files",
        error,
      );
    }
  }

  async deleteExpired(now: Date): Promise<number> {
    try {
      const result = await this.executor
        .delete(storedFiles)
        .where(
          and(
            eq(storedFiles.status, "TEMPORARY"),
            lt(storedFiles.expiresAt, now),
          ),
        )
        .returning({ id: storedFiles.id });

      return result.length;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete expired files",
        error,
      );
    }
  }

  async getTotalSize(): Promise<number> {
    try {
      const result = await this.executor
        .select({
          total: sql<number>`coalesce(sum(${storedFiles.size}), 0)`,
        })
        .from(storedFiles);

      return result[0].total;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to get total file size",
        error,
      );
    }
  }
}
