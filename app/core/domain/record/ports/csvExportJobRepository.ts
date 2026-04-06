import type { AppId } from "@/core/domain/app/valueObject";
import type { CsvExportJob } from "@/core/domain/record/entity";
import type { CsvExportJobId as CsvExportJobIdType } from "@/core/domain/record/valueObject";

/**
 * Repository port for CsvExportJob entity persistence.
 */
export interface CsvExportJobRepository {
  /**
   * Find an export job by its ID.
   * @returns The job, or null if not found
   */
  findById(jobId: CsvExportJobIdType): Promise<CsvExportJob | null>;

  /**
   * Find export jobs for an app (for the download list screen).
   * @returns Array of export jobs
   */
  findByAppId(appId: AppId): Promise<CsvExportJob[]>;

  /**
   * Save an export job (insert or update).
   */
  save(job: CsvExportJob): Promise<CsvExportJob>;

  /**
   * Delete expired export jobs and their output files.
   * Jobs older than 3 days are targeted.
   * @returns Number of deleted jobs
   */
  deleteExpired(): Promise<number>;
}
