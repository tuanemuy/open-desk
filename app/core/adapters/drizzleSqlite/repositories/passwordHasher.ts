import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { PasswordHasher } from "@/core/domain/identity/ports/passwordHasher";
import type { HashedPassword as HashedPasswordType } from "@/core/domain/identity/valueObject";

const scryptAsync = promisify(scrypt);

const ALGORITHM = "scrypt";
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<HashedPasswordType> {
    try {
      const salt = randomBytes(SALT_LENGTH);
      const derivedKey = (await scryptAsync(
        password,
        salt,
        KEY_LENGTH,
      )) as Buffer;
      const hashValue = `${salt.toString("hex")}:${derivedKey.toString("hex")}`;

      return {
        value: hashValue,
        algorithm: ALGORITHM,
      } as HashedPasswordType;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.InternalServerError,
        "Failed to hash password",
        error,
      );
    }
  }

  async verify(
    password: string,
    hashedPassword: HashedPasswordType,
  ): Promise<boolean> {
    try {
      const [saltHex, keyHex] = hashedPassword.value.split(":");
      if (!saltHex || !keyHex) {
        return false;
      }

      const salt = Buffer.from(saltHex, "hex");
      const storedKey = Buffer.from(keyHex, "hex");
      const derivedKey = (await scryptAsync(
        password,
        salt,
        KEY_LENGTH,
      )) as Buffer;

      return timingSafeEqual(storedKey, derivedKey);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.InternalServerError,
        "Failed to verify password",
        error,
      );
    }
  }
}
