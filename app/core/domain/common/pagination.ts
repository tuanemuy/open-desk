/**
 * Pagination request parameters.
 */
export type Pagination = {
  readonly offset: number;
  readonly limit: number;
};

/**
 * Paginated result containing items and total count.
 *
 * @template T - The type of items in the result
 */
export type PaginationResult<T> = {
  readonly items: readonly T[];
  readonly totalCount: number;
};
