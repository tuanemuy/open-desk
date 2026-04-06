/**
 * A generic discriminated union Result type for domain operations.
 * Represents either a successful outcome or a typed error.
 */
export type DomainResult<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
