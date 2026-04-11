import type { DomainResult } from "@/core/domain/common/result";
import type {
  AuthenticationProvider,
  InvalidTokenError,
  TokenExpiredError,
} from "@/core/domain/identity/ports/authenticationProvider";
import type {
  ApiScope,
  OAuthToken as OAuthTokenType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";
import { StubNotImplementedError } from "./error";

export class StubAuthenticationProvider implements AuthenticationProvider {
  validateApiToken(
    _token: string,
  ): Promise<
    DomainResult<{ userId: UserIdType; scopes: ApiScope[] }, InvalidTokenError>
  > {
    throw new StubNotImplementedError("AuthenticationProvider");
  }

  validateOAuthToken(
    _accessToken: string,
  ): Promise<
    DomainResult<
      { userId: UserIdType; scopes: ApiScope[] },
      InvalidTokenError | TokenExpiredError
    >
  > {
    throw new StubNotImplementedError("AuthenticationProvider");
  }

  refreshOAuthToken(
    _refreshToken: string,
  ): Promise<DomainResult<OAuthTokenType, InvalidTokenError>> {
    throw new StubNotImplementedError("AuthenticationProvider");
  }
}
