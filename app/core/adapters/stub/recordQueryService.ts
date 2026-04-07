import type { RecordQueryService } from "@/core/domain/record/services/recordQueryService";
import type {
  QueryExecutionContext,
  RecordQuery,
} from "@/core/domain/record/valueObject";

export class StubRecordQueryService implements RecordQueryService {
  parseAndValidate(_queryString: string): RecordQuery {
    throw new Error("Not implemented");
  }

  resolveFunctions(
    _query: RecordQuery,
    _context: QueryExecutionContext,
  ): RecordQuery {
    throw new Error("Not implemented");
  }
}
