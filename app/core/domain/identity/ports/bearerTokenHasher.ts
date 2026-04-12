import type {
  BearerToken as BearerTokenType,
  HashedBearerToken as HashedBearerTokenType,
} from "@/core/domain/identity/valueObject";

/**
 * Port interface for bearer token generation, hashing, and verification.
 */
export interface BearerTokenHasher {
  /**
   * Generate a new bearer token with sufficient entropy.
   */
  generate(): BearerTokenType;

  /**
   * Hash a plain-text bearer token.
   */
  hash(token: BearerTokenType): HashedBearerTokenType;

  /**
   * Verify a plain-text bearer token against a hashed token.
   * @returns true if the token matches the hash, false otherwise.
   */
  verify(token: BearerTokenType, hashedToken: HashedBearerTokenType): boolean;
}
