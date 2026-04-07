import {
  SystemError,
  SystemErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { StoredFile } from "@/core/domain/file/entity";
import { FileKey, FileMetadata } from "@/core/domain/file/valueObject";
import { UserId } from "@/core/domain/identity/valueObject";
import type { UploadFileOutput } from "./dto";

const MAX_FILE_SIZE_BYTES = 1_073_741_824; // 1 GB

export type UploadFileInput = {
  uploaderId: string;
  fileName: string;
  contentType: string;
  data: ReadableStream;
  size: number;
};

export async function uploadFile({
  container,
  input,
}: ServiceArgs<UploadFileInput>): Promise<UploadFileOutput> {
  if (input.fileName.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "File name is required",
    );
  }
  if (input.size <= 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "File size must be greater than 0",
    );
  }
  if (input.size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "File size exceeds maximum limit of 1GB",
    );
  }

  const uploaderId = UserId.create(input.uploaderId);
  const fileKey = FileKey.create(crypto.randomUUID());

  const { entity: storedFile } = StoredFile.create({
    fileKey,
    fileName: input.fileName,
    contentType: input.contentType,
    size: input.size,
    uploaderId,
  });

  const metadata = FileMetadata.create({
    fileName: input.fileName,
    contentType: input.contentType,
    size: input.size,
  });

  try {
    await container.fileStorageProvider.upload(fileKey, input.data, metadata);
  } catch (error) {
    throw new SystemError(
      SystemErrorCode.StorageError,
      "Failed to upload file to storage",
      error,
    );
  }

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.fileRepository.save(storedFile);
  });

  return {
    fileKey: storedFile.fileKey,
    fileName: storedFile.fileName,
    contentType: storedFile.contentType,
    size: storedFile.size,
    status: storedFile.status,
    uploadedAt: storedFile.uploadedAt,
    expiresAt: storedFile.expiresAt as Date,
  };
}
