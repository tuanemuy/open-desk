import {
  UnauthenticatedError,
  UnauthenticatedErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { authenticateByPassword } from "@/core/domain/identity/services/authenticationService";
import {
  LockoutPolicy,
  LoginName,
  Password,
  PasswordPolicy,
  SessionPolicy,
} from "@/core/domain/identity/valueObject";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { LoginOutput } from "./dto";

export type LoginInput = {
  loginName: string;
  password: string;
  ipAddress: string;
  userAgent: string;
  country?: string;
};

export async function login({
  container,
  input,
}: ServiceArgs<LoginInput>): Promise<LoginOutput> {
  if (input.ipAddress.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "IP address is required",
    );
  }
  if (input.userAgent.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User agent is required",
    );
  }

  const loginName = LoginName.create(input.loginName);
  const passwordPolicy = PasswordPolicy.default();
  Password.create(input.password, passwordPolicy, input.loginName);

  const sessionPolicy = SessionPolicy.create(
    container.config.sessionTimeoutHours * 60,
  );

  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    const lockoutSetting =
      await ctx.systemSettingsRepository.findByKey("lockout_policy");
    const lockoutPolicy = lockoutSetting
      ? LockoutPolicy.create({
          maxFailedAttempts: SystemSetting.getTypedValue(
            lockoutSetting,
            "lockout_policy",
          ).maxFailedAttempts,
          lockoutDuration: SystemSetting.getTypedValue(
            lockoutSetting,
            "lockout_policy",
          ).lockoutDurationMinutes,
        })
      : LockoutPolicy.default();

    return authenticateByPassword(
      {
        userRepository: ctx.userRepository,
        sessionRepository: ctx.sessionRepository,
        passwordHasher: container.passwordHasher,
      },
      {
        loginName,
        password: input.password,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        country: input.country,
        sessionPolicy,
        lockoutPolicy,
      },
    );
  });

  if (!result.ok) {
    switch (result.error.kind) {
      case "InvalidCredentials":
        throw new UnauthenticatedError(
          UnauthenticatedErrorCode.InvalidCredentials,
          "Invalid login name or password",
        );
      case "UserInactive":
        throw new UnauthenticatedError(
          UnauthenticatedErrorCode.UserNotFound,
          "User account is inactive",
        );
      case "AccountLocked":
        throw new UnauthenticatedError(
          UnauthenticatedErrorCode.InvalidCredentials,
          "Account is locked",
        );
      default:
        throw new UnauthenticatedError(
          UnauthenticatedErrorCode.InvalidCredentials,
          "Authentication failed",
        );
    }
  }

  const session = result.value;

  const user = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.userRepository.findById(session.userId);
  });

  if (!user) {
    throw new UnauthenticatedError(
      UnauthenticatedErrorCode.UserNotFound,
      "User not found",
    );
  }

  return {
    sessionId: session.sessionId,
    userId: session.userId,
    displayName: user.displayName,
    language: user.language,
    timezone: user.timezone,
    expiresAt: session.expiresAt,
  };
}
