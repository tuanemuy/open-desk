import type { RecordQueryService } from "@/core/domain/record/services/recordQueryService";
import type {
  QueryExecutionContext,
  RecordQuery,
} from "@/core/domain/record/valueObject";
import { StubNotImplementedError } from "./error";

export class StubRecordQueryService implements RecordQueryService {
  parseAndValidate(_queryString: string): RecordQuery {
    throw new StubNotImplementedError("RecordQueryService");
  }

  resolveFunctions(
    _query: RecordQuery,
    _context: QueryExecutionContext,
  ): RecordQuery {
    throw new StubNotImplementedError("RecordQueryService");
  }
}
