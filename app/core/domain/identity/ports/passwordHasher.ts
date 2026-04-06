import type { HashedPassword as HashedPasswordType } from "@/core/domain/identity/valueObject";

/**
 * Port interface for password hashing and verification.
 */
export interface PasswordHasher {
  /**
   * Hash a plain-text password.
   */
  hash(password: string): Promise<HashedPasswordType>;

  /**
   * Verify a plain-text password against a hashed password.
   * @returns true if the password matches the hash, false otherwise.
   */
  verify(
    password: string,
    hashedPassword: HashedPasswordType,
  ): Promise<boolean>;
}
