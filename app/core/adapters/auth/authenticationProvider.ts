import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/core/adapters/drizzleSqlite/client";
import { apiTokenRecords } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { DomainResult } from "@/core/domain/common/result";
import type {
  AuthenticationProvider,
  InvalidTokenError,
  TokenExpiredError,
} from "@/core/domain/identity/ports/authenticationProvider";
import type { BearerTokenHasher } from "@/core/domain/identity/ports/bearerTokenHasher";
import type {
  ApiScope,
  BearerToken as BearerTokenType,
  OAuthToken as OAuthTokenType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";
import { OAuthToken, UserId } from "@/core/domain/identity/valueObject";

const HMAC_ALGORITHM = "sha256";
const ACCESS_TOKEN_PREFIX = "oat_";
const REFRESH_TOKEN_PREFIX = "ort_";
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 3600;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 86400 * 30;

type OAuthTokenPayload = {
  readonly sub: string;
  readonly scopes: readonly string[];
  readonly exp: number;
  readonly iat: number;
  readonly kind: "access" | "refresh";
};

function getOAuthSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new SystemError(
      SystemErrorCode.InternalServerError,
      "SESSION_SECRET environment variable is not set",
    );
  }
  return secret;
}

function signPayload(payload: OAuthTokenPayload, secret: string): string {
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson, "utf-8").toString("base64url");
  const signature = createHmac(HMAC_ALGORITHM, secret)
    .update(payloadBase64)
    .digest("base64url");
  return `${payloadBase64}.${signature}`;
}

function verifyAndParseToken(
  token: string,
  secret: string,
): OAuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64, providedSignature] = parts;

  const expectedSignature = createHmac(HMAC_ALGORITHM, secret)
    .update(payloadBase64)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSignature, "utf-8");
  const expectedBuf = Buffer.from(expectedSignature, "utf-8");

  if (providedBuf.length !== expectedBuf.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(payloadBase64, "base64url").toString(
      "utf-8",
    );
    const payload = JSON.parse(payloadJson) as OAuthTokenPayload;

    if (
      typeof payload.sub !== "string" ||
      !Array.isArray(payload.scopes) ||
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number" ||
      (payload.kind !== "access" && payload.kind !== "refresh")
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function createOAuthTokenPair(
  userId: UserIdType,
  scopes: readonly ApiScope[],
  secret: string,
): OAuthTokenType {
  const now = Math.floor(Date.now() / 1000);

  const accessPayload: OAuthTokenPayload = {
    sub: userId,
    scopes,
    exp: now + DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    iat: now,
    kind: "access",
  };

  const refreshPayload: OAuthTokenPayload = {
    sub: userId,
    scopes,
    exp: now + DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
    iat: now,
    kind: "refresh",
  };

  const accessToken = `${ACCESS_TOKEN_PREFIX}${signPayload(accessPayload, secret)}`;
  const refreshToken = `${REFRESH_TOKEN_PREFIX}${signPayload(refreshPayload, secret)}`;

  return OAuthToken.create({
    accessToken,
    refreshToken,
    expiresAt: new Date(accessPayload.exp * 1000),
    scopes,
  });
}

export class AuthenticationProviderImpl implements AuthenticationProvider {
  constructor(
    private readonly db: Database,
    private readonly bearerTokenHasher: BearerTokenHasher,
  ) {}

  async validateApiToken(
    token: string,
  ): Promise<
    DomainResult<{ userId: UserIdType; scopes: ApiScope[] }, InvalidTokenError>
  > {
    const hashedToken = this.bearerTokenHasher.hash(token as BearerTokenType);

    try {
      const now = new Date();

      const results = await this.db
        .select()
        .from(apiTokenRecords)
        .where(
          and(
            eq(apiTokenRecords.tokenHash, hashedToken.value),
            isNull(apiTokenRecords.revokedAt),
          ),
        )
        .limit(1);

      if (results.length === 0) {
        return { ok: false, error: { kind: "InvalidToken" } };
      }

      const record = results[0];

      if (record.expiresAt !== null && record.expiresAt <= now) {
        return { ok: false, error: { kind: "InvalidToken" } };
      }

      return {
        ok: true,
        value: {
          userId: record.userId as UserIdType,
          scopes: (record.scopes ?? []) as ApiScope[],
        },
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to validate API token",
        error,
      );
    }
  }

  async validateOAuthToken(
    accessToken: string,
  ): Promise<
    DomainResult<
      { userId: UserIdType; scopes: ApiScope[] },
      InvalidTokenError | TokenExpiredError
    >
  > {
    if (!accessToken.startsWith(ACCESS_TOKEN_PREFIX)) {
      return { ok: false, error: { kind: "InvalidToken" } };
    }

    const rawToken = accessToken.slice(ACCESS_TOKEN_PREFIX.length);
    const secret = getOAuthSecret();
    const payload = verifyAndParseToken(rawToken, secret);

    if (payload === null) {
      return { ok: false, error: { kind: "InvalidToken" } };
    }

    if (payload.kind !== "access") {
      return { ok: false, error: { kind: "InvalidToken" } };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return { ok: false, error: { kind: "TokenExpired" } };
    }

    return {
      ok: true,
      value: {
        userId: UserId.create(payload.sub),
        scopes: payload.scopes as ApiScope[],
      },
    };
  }

  async refreshOAuthToken(
    refreshToken: string,
  ): Promise<DomainResult<OAuthTokenType, InvalidTokenError>> {
    if (!refreshToken.startsWith(REFRESH_TOKEN_PREFIX)) {
      return { ok: false, error: { kind: "InvalidToken" } };
    }

    const rawToken = refreshToken.slice(REFRESH_TOKEN_PREFIX.length);
    const secret = getOAuthSecret();
    const payload = verifyAndParseToken(rawToken, secret);

    if (payload === null) {
      return { ok: false, error: { kind: "InvalidToken" } };
    }

    if (payload.kind !== "refresh") {
      return { ok: false, error: { kind: "InvalidToken" } };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return { ok: false, error: { kind: "InvalidToken" } };
    }

    const userId = UserId.create(payload.sub);
    const scopes = payload.scopes as ApiScope[];

    const newToken = createOAuthTokenPair(userId, scopes, secret);

    return { ok: true, value: newToken };
  }
}
