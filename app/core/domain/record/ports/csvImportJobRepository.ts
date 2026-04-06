import type { CsvImportJob } from "@/core/domain/record/entity";
import type { CsvImportJobId as CsvImportJobIdType } from "@/core/domain/record/valueObject";

/**
 * Repository port for CsvImportJob entity persistence.
 */
export interface CsvImportJobRepository {
  /**
   * Find an import job by its ID.
   * @returns The job, or null if not found
   */
  findById(jobId: CsvImportJobIdType): Promise<CsvImportJob | null>;

  /**
   * Save an import job (insert or update).
   */
  save(job: CsvImportJob): Promise<CsvImportJob>;
}
