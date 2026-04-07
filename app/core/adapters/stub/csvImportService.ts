import type { CsvImportJob } from "@/core/domain/record/entity";
import type { CsvImportService } from "@/core/domain/record/services/csvImportService";

export class StubCsvImportService implements CsvImportService {
  processImport(
    _job: CsvImportJob,
    _fileContent: ArrayBuffer,
  ): Promise<CsvImportJob> {
    throw new Error("Not implemented");
  }
}
