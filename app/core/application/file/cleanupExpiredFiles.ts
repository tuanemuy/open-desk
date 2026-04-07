import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import type { CleanupExpiredFilesOutput } from "./dto";

export type CleanupExpiredFilesInput = {
  now: Date;
};

export async function cleanupExpiredFiles({
  container,
  input,
}: ServiceArgs<CleanupExpiredFilesInput>): Promise<CleanupExpiredFilesOutput> {
  const expiredFiles = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.fileRepository.findExpired(input.now);
    },
  );

  if (expiredFiles.length === 0) {
    return { deletedCount: 0 };
  }

  const fileKeys = expiredFiles.map((file) => file.fileKey);

  try {
    await container.fileStorageProvider.deleteBatch(fileKeys);
  } catch (error) {
    throw new SystemError(
      SystemErrorCode.StorageError,
      "Failed to delete expired files from storage",
      error,
    );
  }

  const deletedCount = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.fileRepository.deleteExpired(input.now);
    },
  );

  return { deletedCount };
}
