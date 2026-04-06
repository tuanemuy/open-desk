import type { CsvImportJob } from "@/core/domain/record/entity";

/**
 * Domain service port for CSV import orchestration.
 *
 * Parses CSV file content and creates/updates records in bulk:
 * - ADD_ONLY mode: All rows are created as new records
 * - UPSERT mode: Existing records are updated by updateKey, new records are created
 * - Error handling: CONTINUE skips error rows, STOP halts processing at the error row
 */
export interface CsvImportService {
  /**
   * Process the CSV import by parsing file content and creating/updating records.
   *
   * @param job - Import job (includes mapping information)
   * @param fileContent - Binary content of the file
   * @returns Updated job with confirmed processed/error counts
   */
  processImport(
    job: CsvImportJob,
    fileContent: ArrayBuffer,
  ): Promise<CsvImportJob>;
}
