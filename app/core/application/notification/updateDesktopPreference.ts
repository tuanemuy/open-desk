import type { UserId } from "@/core/domain/identity/valueObject";
import { NotificationPreference } from "@/core/domain/notification/entity";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { DesktopPreferenceOutput } from "./dto";

export type UpdateDesktopPreferenceInput = {
  readonly operatorId: string;
  readonly desktopEnabled: boolean;
};

export async function updateDesktopPreference({
  container,
  input,
}: ServiceArgs<UpdateDesktopPreferenceInput>): Promise<DesktopPreferenceOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    let preference =
      await ctx.notificationPreferenceRepository.findByUserId(operatorId);
    if (!preference)
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Notification preference not found",
      );

    preference = NotificationPreference.setDesktopEnabled(
      preference,
      input.desktopEnabled,
    );
    await ctx.notificationPreferenceRepository.save(preference);

    return {
      desktopEnabled: preference.desktopEnabled,
      updatedAt: preference.updatedAt,
    };
  });
}
