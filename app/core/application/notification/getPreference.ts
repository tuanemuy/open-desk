import type { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { PreferenceOutput } from "./dto";

export type GetPreferenceInput = { readonly operatorId: string };

export async function getPreference({
  container,
  input,
}: ServiceArgs<GetPreferenceInput>): Promise<PreferenceOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const preference =
      await ctx.notificationPreferenceRepository.findByUserId(operatorId);
    if (!preference)
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Notification preference not found",
      );

    return {
      emailEnabled: preference.emailEnabled,
      emailScope: preference.emailScope,
      emailFormat: preference.emailFormat,
      desktopEnabled: preference.desktopEnabled,
    };
  });
}
