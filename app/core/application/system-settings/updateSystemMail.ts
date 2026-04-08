import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type {
  ExternalMailServer,
  MailServerType,
  SystemMail,
} from "@/core/domain/system-settings/valueObject";
import type { SystemMailOutput } from "./dto";

export type UpdateSystemMailInput = {
  fromAddress: string;
  serverType: string;
  externalServer: ExternalMailServer | null;
};

const VALID_SERVER_TYPES: readonly string[] = ["BUILTIN", "EXTERNAL"];

export async function updateSystemMail({
  container,
  input,
}: ServiceArgs<UpdateSystemMailInput>): Promise<SystemMailOutput> {
  if (input.fromAddress.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "fromAddress must not be empty",
    );
  }

  if (!VALID_SERVER_TYPES.includes(input.serverType)) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `serverType must be "BUILTIN" or "EXTERNAL", got "${input.serverType}"`,
    );
  }

  if (input.serverType === "EXTERNAL") {
    if (!input.externalServer) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "externalServer is required when serverType is EXTERNAL",
      );
    }
    if (input.externalServer.host.length === 0) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "externalServer.host must not be empty",
      );
    }
    if (input.externalServer.username.length === 0) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "externalServer.username must not be empty",
      );
    }
    if (input.externalServer.passwordEncrypted.length === 0) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "externalServer.passwordEncrypted must not be empty",
      );
    }
  }

  if (input.serverType === "BUILTIN" && input.externalServer !== null) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "externalServer must be null when serverType is BUILTIN",
    );
  }

  const systemMail: SystemMail = {
    fromAddress: input.fromAddress,
    serverType: input.serverType as MailServerType,
    externalServer: input.externalServer,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("system_mail");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "system_mail" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, systemMail);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return systemMail;
}
