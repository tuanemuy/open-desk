import type { InferSelectModel } from "drizzle-orm";
import { eq, lt } from "drizzle-orm";
import { csvExportJobs } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { CsvExportJob } from "@/core/domain/record/entity";
import type { CsvExportJobRepository } from "@/core/domain/record/ports/csvExportJobRepository";
import type {
  CsvDelimiter,
  CsvEncoding,
  CsvExportJobId,
  CsvExportJobStatus,
  FieldCode,
} from "@/core/domain/record/valueObject";
import type { Executor } from "../client";

type CsvExportJobDataModel = InferSelectModel<typeof csvExportJobs>;

export class DrizzleSqliteCsvExportJobRepository
  implements CsvExportJobRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: CsvExportJobDataModel): CsvExportJob {
    return {
      jobId: data.id as CsvExportJobId,
      appId: data.appId as AppId,
      viewId: data.viewId ?? null,
      encoding: data.encoding as CsvEncoding,
      delimiter: data.delimiter as CsvDelimiter,
      includeHeader: data.includeHeader,
      exportFields: (data.exportFields as unknown as string[]).map(
        (f) => f as FieldCode,
      ),
      includeComments: data.includeComments,
      status: data.status as CsvExportJobStatus,
      outputFileName: data.outputFileName ?? null,
      outputFileSize: data.outputFileSize ?? null,
      creatorId: data.creatorId as UserId,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  }

  async findById(jobId: CsvExportJobId): Promise<CsvExportJob | null> {
    try {
      const results = await this.executor
        .select()
        .from(csvExportJobs)
        .where(eq(csvExportJobs.id, jobId as string));

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find CSV export job by ID",
        error,
      );
    }
  }

  async findByAppId(appId: AppId): Promise<CsvExportJob[]> {
    try {
      const results = await this.executor
        .select()
        .from(csvExportJobs)
        .where(eq(csvExportJobs.appId, appId as string));

      return results.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find CSV export jobs by app ID",
        error,
      );
    }
  }

  async save(job: CsvExportJob): Promise<CsvExportJob> {
    try {
      const values = {
        id: job.jobId as string,
        appId: job.appId as string,
        viewId: job.viewId ?? null,
        encoding: job.encoding as string,
        delimiter: job.delimiter as string,
        includeHeader: job.includeHeader,
        exportFields: [...job.exportFields] as unknown,
        includeComments: job.includeComments,
        status: job.status as string,
        outputFileName: job.outputFileName ?? null,
        outputFileSize: job.outputFileSize ?? null,
        creatorId: job.creatorId as string,
        createdAt: job.createdAt,
        expiresAt: job.expiresAt,
      };

      await this.executor
        .insert(csvExportJobs)
        .values(values)
        .onConflictDoUpdate({
          target: csvExportJobs.id,
          set: {
            status: values.status,
            outputFileName: values.outputFileName,
            outputFileSize: values.outputFileSize,
          },
        });

      return job;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save CSV export job",
        error,
      );
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const now = new Date();
      const result = await this.executor
        .delete(csvExportJobs)
        .where(lt(csvExportJobs.expiresAt, now));

      return result.rowsAffected;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete expired CSV export jobs",
        error,
      );
    }
  }
}
