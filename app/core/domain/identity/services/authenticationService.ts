import type { DomainResult } from "@/core/domain/common/result";
import type { Session } from "@/core/domain/identity/entity";
import { Session as SessionEntity } from "@/core/domain/identity/entity";
import type {
  AuthenticationProvider,
  InvalidCredentialsError,
  InvalidTokenError,
  TokenExpiredError,
} from "@/core/domain/identity/ports/authenticationProvider";
import type { PasswordHasher } from "@/core/domain/identity/ports/passwordHasher";
import type { SessionRepository } from "@/core/domain/identity/ports/sessionRepository";
import type { UserRepository } from "@/core/domain/identity/ports/userRepository";
import {
  type ApiScope,
  LockoutPolicy,
  type LockoutPolicy as LockoutPolicyType,
  type LoginName as LoginNameType,
  type SessionId as SessionIdType,
  type SessionPolicy as SessionPolicyType,
  type UserId as UserIdType,
} from "@/core/domain/identity/valueObject";

// ============================================
// Authentication Error Types
// ============================================

export type UserInactiveError = {
  readonly kind: "UserInactive";
  readonly userId: UserIdType;
};

export type AccountLockedError = {
  readonly kind: "AccountLocked";
  readonly userId: UserIdType;
  readonly unlockAt: Date | null;
};

export type SessionNotFoundError = {
  readonly kind: "SessionNotFound";
  readonly sessionId: SessionIdType;
};

export type SessionExpiredError = {
  readonly kind: "SessionExpired";
  readonly sessionId: SessionIdType;
};

export type UserNotFoundError = {
  readonly kind: "UserNotFound";
  readonly userId: UserIdType;
};

export type AuthenticationError =
  | InvalidCredentialsError
  | UserInactiveError
  | AccountLockedError
  | InvalidTokenError
  | TokenExpiredError
  | SessionNotFoundError
  | SessionExpiredError;

// ============================================
// Service Dependencies
// ============================================

export type AuthenticationServiceDeps = {
  readonly userRepository: UserRepository;
  readonly sessionRepository: SessionRepository;
  readonly passwordHasher: PasswordHasher;
  readonly authenticationProvider: AuthenticationProvider;
};

// ============================================
// Authentication Service
// ============================================

/**
 * Authenticate a user by password and create a session.
 *
 * Side effects:
 * - On password verification failure (when lockout policy is enabled):
 *   calls `deps.userRepository.recordFailedLogin` to increment the failure count
 *   and optionally set the lock time.
 * - On password verification success (when previous failures exist):
 *   calls `deps.userRepository.clearFailedLogin` to reset the failure count.
 */
export async function authenticateByPassword(
  deps: Pick<
    AuthenticationServiceDeps,
    "userRepository" | "sessionRepository" | "passwordHasher"
  >,
  params: {
    loginName: LoginNameType;
    password: string;
    ipAddress: string;
    userAgent: string;
    country?: string;
    sessionPolicy: SessionPolicyType;
    lockoutPolicy: LockoutPolicyType;
  },
): Promise<DomainResult<Session, AuthenticationError>> {
  const credentials = await deps.userRepository.findCredentialsByLoginName(
    params.loginName,
  );
  if (!credentials) {
    return { ok: false, error: { kind: "InvalidCredentials" } };
  }

  if (!credentials.isActive) {
    return {
      ok: false,
      error: { kind: "UserInactive", userId: credentials.userId },
    };
  }

  // Lockout check (always executed regardless of lockoutPolicy values).
  // Note: failedLoginAttempts is NOT reset when the lock expires — if the user
  // enters a wrong password after expiry, the count continues from where it was,
  // causing an immediate re-lock. This is intentional for security.
  if (
    credentials.lockedUntil !== null &&
    credentials.lockedUntil > new Date()
  ) {
    return {
      ok: false,
      error: {
        kind: "AccountLocked",
        userId: credentials.userId,
        unlockAt: credentials.lockedUntil,
      },
    };
  }

  // Verify the password against the stored hash
  const isPasswordValid = await deps.passwordHasher.verify(
    params.password,
    credentials.hashedPassword,
  );
  if (!isPasswordValid) {
    // Record failed login attempt when lockout policy is enabled
    if (params.lockoutPolicy.maxFailedAttempts !== null) {
      const newCount = credentials.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;
      if (newCount >= params.lockoutPolicy.maxFailedAttempts) {
        lockedUntil =
          params.lockoutPolicy.lockoutDuration === null
            ? LockoutPolicy.PERMANENT_LOCK_DATE
            : new Date(
                Date.now() + params.lockoutPolicy.lockoutDuration * 60 * 1000,
              );
      }
      await deps.userRepository.recordFailedLogin(
        credentials.userId,
        newCount,
        lockedUntil,
      );
    }
    return { ok: false, error: { kind: "InvalidCredentials" } };
  }

  // Clear failed login state on successful authentication
  if (credentials.failedLoginAttempts > 0 || credentials.lockedUntil !== null) {
    await deps.userRepository.clearFailedLogin(credentials.userId);
  }

  const { entity: session } = SessionEntity.create({
    userId: credentials.userId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    country: params.country,
    timeoutMinutes: params.sessionPolicy.timeoutMinutes,
  });

  await deps.sessionRepository.save(session);

  return { ok: true, value: session };
}

/**
 * Authenticate by API token.
 */
export async function authenticateByApiToken(
  deps: Pick<AuthenticationServiceDeps, "authenticationProvider">,
  params: { token: string },
): Promise<
  DomainResult<{ userId: UserIdType; scopes: ApiScope[] }, AuthenticationError>
> {
  const result = await deps.authenticationProvider.validateApiToken(
    params.token,
  );
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, value: result.value };
}

/**
 * Authenticate by OAuth access token.
 */
export async function authenticateByOAuth(
  deps: Pick<AuthenticationServiceDeps, "authenticationProvider">,
  params: { accessToken: string },
): Promise<
  DomainResult<{ userId: UserIdType; scopes: ApiScope[] }, AuthenticationError>
> {
  const result = await deps.authenticationProvider.validateOAuthToken(
    params.accessToken,
  );
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, value: result.value };
}

/**
 * Authenticate by session (cookie-based).
 * Validates session existence and expiration.
 * CSRF token verification is the responsibility of the presentation layer / middleware.
 */
export async function authenticateBySession(
  deps: Pick<AuthenticationServiceDeps, "sessionRepository">,
  params: {
    sessionId: SessionIdType;
  },
): Promise<DomainResult<UserIdType, AuthenticationError>> {
  const session = await deps.sessionRepository.findById(params.sessionId);
  if (!session) {
    return {
      ok: false,
      error: { kind: "SessionNotFound", sessionId: params.sessionId },
    };
  }

  if (SessionEntity.isExpired(session, new Date())) {
    return {
      ok: false,
      error: { kind: "SessionExpired", sessionId: params.sessionId },
    };
  }

  return { ok: true, value: session.userId };
}

/**
 * Terminate a session (logout).
 */
export async function terminateSession(
  deps: Pick<AuthenticationServiceDeps, "sessionRepository">,
  sessionId: SessionIdType,
): Promise<DomainResult<void, SessionNotFoundError>> {
  const session = await deps.sessionRepository.findById(sessionId);
  if (!session) {
    return {
      ok: false,
      error: { kind: "SessionNotFound", sessionId },
    };
  }

  const { entity: terminatedSession } = SessionEntity.terminate(session);
  await deps.sessionRepository.save(terminatedSession);

  return { ok: true, value: undefined };
}

/**
 * Terminate all sessions for a user (admin forced logout).
 */
export async function terminateAllSessions(
  deps: Pick<AuthenticationServiceDeps, "userRepository" | "sessionRepository">,
  userId: UserIdType,
): Promise<DomainResult<void, UserNotFoundError>> {
  const user = await deps.userRepository.findById(userId);
  if (!user) {
    return {
      ok: false,
      error: { kind: "UserNotFound", userId },
    };
  }

  await deps.sessionRepository.deleteByUserId(userId);

  return { ok: true, value: undefined };
}
