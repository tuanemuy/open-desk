import { createHash, randomBytes } from "node:crypto";
import type { BearerTokenHasher } from "@/core/domain/identity/ports/bearerTokenHasher";
import type {
  BearerToken as BearerTokenType,
  HashedBearerToken as HashedBearerTokenType,
} from "@/core/domain/identity/valueObject";

const ALGORITHM = "sha256";
const TOKEN_BYTES = 32;

export class ScryptBearerTokenHasher implements BearerTokenHasher {
  generate(): BearerTokenType {
    const token = randomBytes(TOKEN_BYTES).toString("hex");
    return token as BearerTokenType;
  }

  hash(token: BearerTokenType): HashedBearerTokenType {
    const hashValue = createHash(ALGORITHM)
      .update(token as string)
      .digest("hex");

    return {
      value: hashValue,
      algorithm: ALGORITHM,
    } as HashedBearerTokenType;
  }

  verify(token: BearerTokenType, hashedToken: HashedBearerTokenType): boolean {
    const computed = createHash(ALGORITHM)
      .update(token as string)
      .digest("hex");

    // Use constant-time comparison to prevent timing attacks
    if (computed.length !== hashedToken.value.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < computed.length; i++) {
      result |= computed.charCodeAt(i) ^ hashedToken.value.charCodeAt(i);
    }

    return result === 0;
  }
}
