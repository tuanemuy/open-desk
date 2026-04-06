import type { DomainResult } from "@/core/domain/common/result";
import type {
  ApiScope,
  OAuthToken as OAuthTokenType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";

/**
 * Error returned when credentials are invalid.
 */
export type InvalidCredentialsError = {
  readonly kind: "InvalidCredentials";
};

/**
 * Error returned when a token is invalid.
 */
export type InvalidTokenError = {
  readonly kind: "InvalidToken";
};

/**
 * Error returned when a token has expired.
 */
export type TokenExpiredError = {
  readonly kind: "TokenExpired";
};

/**
 * Port interface for external authentication mechanisms (OAuth, API tokens).
 * Password authentication is handled by the domain service using PasswordHasher directly.
 */
export interface AuthenticationProvider {
  /**
   * Validate an API token and return the associated user and scopes.
   */
  validateApiToken(
    token: string,
  ): Promise<
    DomainResult<{ userId: UserIdType; scopes: ApiScope[] }, InvalidTokenError>
  >;

  /**
   * Validate an OAuth access token and return the associated user and scopes.
   */
  validateOAuthToken(
    accessToken: string,
  ): Promise<
    DomainResult<
      { userId: UserIdType; scopes: ApiScope[] },
      InvalidTokenError | TokenExpiredError
    >
  >;

  /**
   * Refresh an OAuth token using a refresh token.
   */
  refreshOAuthToken(
    refreshToken: string,
  ): Promise<DomainResult<OAuthTokenType, InvalidTokenError>>;
}
