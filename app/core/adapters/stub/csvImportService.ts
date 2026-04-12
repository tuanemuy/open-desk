import type { CsvImportJob } from "@/core/domain/record/entity";
import type { CsvImportService } from "@/core/domain/record/services/csvImportService";
import { StubNotImplementedError } from "./error";

export class StubCsvImportService implements CsvImportService {
  processImport(
    _job: CsvImportJob,
    _fileContent: ArrayBuffer,
  ): Promise<CsvImportJob> {
    throw new StubNotImplementedError("CsvImportService");
  }
}
