import { container } from "@/core/application/container/server.instance";
import { updateLockoutPolicy } from "@/core/application/system-settings/updateLockoutPolicy";
import { updatePasswordPolicy } from "@/core/application/system-settings/updatePasswordPolicy";
import { updateSamlAuth } from "@/core/application/system-settings/updateSamlAuth";
import { updateSessionPolicy } from "@/core/application/system-settings/updateSessionPolicy";
import { updateTwoFactorAuth } from "@/core/application/system-settings/updateTwoFactorAuth";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { saveSecuritySchema } from "./schemas";

function parseLockoutDuration(value: string): number | null {
  switch (value) {
    case "3min":
      return 3;
    case "15min":
      return 15;
    case "30min":
      return 30;
    case "60min":
      return 60;
    case "never":
      return null;
    default:
      return 3;
  }
}

function parseSessionTimeout(value: string): number {
  switch (value) {
    case "15min":
      return 15;
    case "30min":
      return 30;
    case "1h":
      return 60;
    case "2h":
      return 120;
    case "4h":
      return 240;
    case "8h":
      return 480;
    case "12h":
      return 720;
    case "24h":
      return 1440;
    default:
      return 1440;
  }
}

export const handlers = {
  saveSettings: defineHandler({
    schema: saveSecuritySchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      const headers = args.request.headers;

      const passwordPolicyResult = await handleUseCase(() =>
        updatePasswordPolicy({
          container,
          headers,
          input: {
            userMinLength: value.userPasswordMinLength,
            adminMinLength: value.adminPasswordMinLength,
            complexity: value.complexity,
            allowSameAsLoginName: false,
            expirationDays: null,
            historyCount: 0,
            allowUserChange: true,
            requireChangeOnNextLogin: false,
            allowUserReset: true,
          },
        }),
      );
      if (passwordPolicyResult.isErr()) {
        return error({ "": [passwordPolicyResult.error.message] });
      }

      const lockoutPolicyResult = await handleUseCase(() =>
        updateLockoutPolicy({
          container,
          headers,
          input: {
            maxFailedAttempts:
              value.lockoutAttempts === 0 ? null : value.lockoutAttempts,
            lockoutDurationMinutes: parseLockoutDuration(value.lockoutDuration),
            failedLoginMessage: {},
          },
        }),
      );
      if (lockoutPolicyResult.isErr()) {
        return error({ "": [lockoutPolicyResult.error.message] });
      }

      const sessionPolicyResult = await handleUseCase(() =>
        updateSessionPolicy({
          container,
          headers,
          input: {
            sessionLifetimeMinutes: parseSessionTimeout(value.sessionTimeout),
            allowAutoComplete: false,
            allowBrowserSave: false,
            allowAutoLogin: false,
            autoLoginExpiration: null,
            allowMismatchedApiAuth: false,
          },
        }),
      );
      if (sessionPolicyResult.isErr()) {
        return error({ "": [sessionPolicyResult.error.message] });
      }

      const samlAuthResult = await handleUseCase(() =>
        updateSamlAuth({
          container,
          headers,
          input: {
            enabled: value.samlEnabled,
          },
        }),
      );
      if (samlAuthResult.isErr()) {
        return error({ "": [samlAuthResult.error.message] });
      }

      const twoFactorAuthResult = await handleUseCase(() =>
        updateTwoFactorAuth({
          container,
          headers,
          input: {
            enabled: value.twoFactorEnabled,
          },
        }),
      );
      if (twoFactorAuthResult.isErr()) {
        return error({ "": [twoFactorAuthResult.error.message] });
      }

      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
