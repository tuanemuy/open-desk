import {
  UnauthenticatedError,
  UnauthenticatedErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import type { RefreshOAuthTokenOutput } from "./dto";

export type RefreshOAuthTokenInput = {
  refreshToken: string;
};

export async function refreshOAuthToken({
  container,
  input,
}: ServiceArgs<RefreshOAuthTokenInput>): Promise<RefreshOAuthTokenOutput> {
  if (input.refreshToken.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Refresh token is required",
    );
  }

  const result = await container.authenticationProvider.refreshOAuthToken(
    input.refreshToken,
  );

  if (!result.ok) {
    throw new UnauthenticatedError(
      UnauthenticatedErrorCode.InvalidToken,
      "Refresh token is invalid",
    );
  }

  const oauthToken = result.value;

  return {
    accessToken: oauthToken.accessToken,
    refreshToken: oauthToken.refreshToken,
    expiresAt: oauthToken.expiresAt,
    scopes: [...oauthToken.scopes],
  };
}
