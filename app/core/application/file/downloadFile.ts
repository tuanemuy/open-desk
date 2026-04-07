import {
  NotFoundError,
  NotFoundErrorCode,
  SystemError,
  SystemErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { StoredFile } from "@/core/domain/file/entity";
import { FileKey } from "@/core/domain/file/valueObject";
import type { DownloadFileOutput } from "./dto";

export type DownloadFileInput = {
  fileKey: string;
};

export async function downloadFile({
  container,
  input,
}: ServiceArgs<DownloadFileInput>): Promise<DownloadFileOutput> {
  if (input.fileKey.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "File key is required",
    );
  }

  const fileKey = FileKey.create(input.fileKey);

  const storedFile = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.fileRepository.findByKey(fileKey);
    },
  );

  if (!storedFile) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `File ${input.fileKey} not found`,
    );
  }

  if (StoredFile.isExpired(storedFile, new Date())) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `File ${input.fileKey} has expired`,
    );
  }

  try {
    const { data, metadata } =
      await container.fileStorageProvider.download(fileKey);

    return {
      data,
      fileName: metadata.fileName,
      contentType: metadata.contentType,
      size: metadata.size,
    };
  } catch (error) {
    throw new SystemError(
      SystemErrorCode.StorageError,
      "Failed to download file from storage",
      error,
    );
  }
}
