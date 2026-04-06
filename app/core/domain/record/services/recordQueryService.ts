import type {
  QueryExecutionContext,
  RecordQuery,
} from "@/core/domain/record/valueObject";

/**
 * Domain service port for query construction and validation.
 *
 * Handles parsing, validation, and function resolution for record queries.
 * For detailed query specification (operators, functions, syntax), see spec/api/query.md.
 */
export interface RecordQueryService {
  /**
   * Parse and validate a query string.
   * - Checks operator availability per field type
   * - Checks function availability (LOGINUSER, TODAY, NOW, FROM_TODAY, etc.)
   * - Validates offset limit (10,000)
   * - Validates limit (multiple record retrieval: 500, others: 100)
   * - Validates escape correctness
   *
   * @param queryString - The query string to parse
   * @returns Parsed RecordQuery
   * @throws BusinessRuleError with QuerySyntaxError if the syntax is invalid
   * @throws BusinessRuleError with QueryValidationError for validation failures
   */
  parseAndValidate(queryString: string): RecordQuery;

  /**
   * Resolve functions in a parsed query based on the execution context.
   * - LOGINUSER() -> executing user's code
   * - PRIMARY_ORGANIZATION() -> executing user's primary organization code
   * - TODAY() -> execution date
   * - NOW() -> execution datetime
   * - FROM_TODAY(n, unit) -> relative date from today
   * - THIS_WEEK(), LAST_WEEK(), NEXT_WEEK() -> week start/end dates
   * - THIS_MONTH(), LAST_MONTH(), NEXT_MONTH() -> month start/end dates
   * - THIS_YEAR(), LAST_YEAR(), NEXT_YEAR() -> year start/end dates
   *
   * @param query - Parsed query
   * @param context - Execution context (login user, current datetime, etc.)
   * @returns Query with resolved functions
   */
  resolveFunctions(
    query: RecordQuery,
    context: QueryExecutionContext,
  ): RecordQuery;
}
