import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { csvImportJobs } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { CsvImportJob } from "@/core/domain/record/entity";
import type { CsvImportJobRepository } from "@/core/domain/record/ports/csvImportJobRepository";
import type {
  CsvDelimiter,
  CsvEncoding,
  CsvImportError,
  CsvImportJobId,
  CsvImportJobStatus,
  ErrorHandling,
  FieldCode,
  FieldMapping,
  ImportMode,
} from "@/core/domain/record/valueObject";
import type { Executor } from "../client";

type CsvImportJobDataModel = InferSelectModel<typeof csvImportJobs>;

export class DrizzleSqliteCsvImportJobRepository
  implements CsvImportJobRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: CsvImportJobDataModel): CsvImportJob {
    return {
      jobId: data.id as CsvImportJobId,
      appId: data.appId as AppId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      encoding: data.encoding as CsvEncoding,
      delimiter: data.delimiter as CsvDelimiter,
      importMode: data.importMode as ImportMode,
      updateKey: (data.updateKey as FieldCode) ?? null,
      errorHandling: data.errorHandling as ErrorHandling,
      fieldMappings: (data.fieldMappings as unknown as FieldMapping[]) ?? [],
      status: data.status as CsvImportJobStatus,
      processedCount: data.processedCount,
      errorCount: data.errorCount,
      errorDetails: (data.errorDetails as unknown as CsvImportError[]) ?? [],
      creatorId: data.creatorId as UserId,
      createdAt: data.createdAt,
    };
  }

  async findById(jobId: CsvImportJobId): Promise<CsvImportJob | null> {
    try {
      const results = await this.executor
        .select()
        .from(csvImportJobs)
        .where(eq(csvImportJobs.id, jobId as string));

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find CSV import job by ID",
        error,
      );
    }
  }

  async save(job: CsvImportJob): Promise<CsvImportJob> {
    try {
      const values = {
        id: job.jobId as string,
        appId: job.appId as string,
        fileName: job.fileName,
        fileSize: job.fileSize,
        encoding: job.encoding as string,
        delimiter: job.delimiter as string,
        importMode: job.importMode as string,
        updateKey: (job.updateKey as string) ?? null,
        errorHandling: job.errorHandling as string,
        fieldMappings: [...job.fieldMappings] as unknown,
        status: job.status as string,
        processedCount: job.processedCount,
        errorCount: job.errorCount,
        errorDetails: [...job.errorDetails] as unknown,
        creatorId: job.creatorId as string,
        createdAt: job.createdAt,
      };

      await this.executor
        .insert(csvImportJobs)
        .values(values)
        .onConflictDoUpdate({
          target: csvImportJobs.id,
          set: {
            status: values.status,
            processedCount: values.processedCount,
            errorCount: values.errorCount,
            errorDetails: values.errorDetails,
          },
        });

      return job;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save CSV import job",
        error,
      );
    }
  }
}
