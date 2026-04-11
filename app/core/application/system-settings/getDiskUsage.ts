import type { ServiceArgs } from "@/core/application/types";

export type DiskUsageOutput = {
  usedBytes: number;
  limitBytes: number;
};

const DISK_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

export async function getDiskUsage({
  container,
}: ServiceArgs): Promise<DiskUsageOutput> {
  const usedBytes = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.fileRepository.getTotalSize();
    },
  );

  return { usedBytes, limitBytes: DISK_LIMIT_BYTES };
}
