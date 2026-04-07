import type { FileKey } from "@/core/domain/file/valueObject";
import { CsvExportJob } from "@/core/domain/record/entity";
import {
  CsvExportJobId,
  CsvExportJobStatus,
} from "@/core/domain/record/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type DownloadExportFileInput = {
  readonly jobId: string;
};

export type ExportFileDownloadOutput = {
  readonly fileName: string;
  readonly data: ReadableStream;
  readonly contentType: string;
};

export async function downloadExportFile({
  container,
  input,
}: ServiceArgs<DownloadExportFileInput>): Promise<ExportFileDownloadOutput> {
  const jobId = CsvExportJobId.create(input.jobId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const job = await ctx.csvExportJobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Export job ${input.jobId} not found`,
      );
    }

    if (job.status !== CsvExportJobStatus.Completed) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        `Export job is not completed (current status: ${job.status})`,
      );
    }

    if (CsvExportJob.isExpired(job, new Date())) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Export file has expired",
      );
    }

    const { data, metadata } = await container.fileStorageProvider.download(
      job.outputFileName as FileKey,
    );

    return {
      fileName: metadata.fileName,
      data,
      contentType: metadata.contentType,
    };
  });
}
