/**
 * Error thrown by stub adapters to indicate that the adapter is not yet implemented.
 *
 * Stub adapters are placeholders for external service dependencies that have not been
 * integrated yet. This error allows callers to distinguish stub "not implemented" errors
 * from genuine runtime errors using `instanceof` checks rather than fragile string comparison.
 */
export class StubNotImplementedError extends Error {
  override readonly name = "StubNotImplementedError";

  constructor(adapterName?: string) {
    super(
      adapterName
        ? `${adapterName}: Not implemented (stub adapter)`
        : "Not implemented (stub adapter)",
    );
  }
}

export function isStubNotImplementedError(
  error: unknown,
): error is StubNotImplementedError {
  return error instanceof StubNotImplementedError;
}
