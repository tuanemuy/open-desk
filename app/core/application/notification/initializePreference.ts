import type { UserId } from "@/core/domain/identity/valueObject";
import {
  NotificationFilter,
  NotificationPreference,
} from "@/core/domain/notification/entity";
import type { ServiceArgs } from "../types";
import type { PreferenceOutput } from "./dto";

export type InitializePreferenceInput = { readonly userId: string };

export async function initializePreference({
  container,
  input,
}: ServiceArgs<InitializePreferenceInput>): Promise<PreferenceOutput> {
  const userId = input.userId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const existing =
      await ctx.notificationPreferenceRepository.findByUserId(userId);
    if (existing) {
      return {
        emailEnabled: existing.emailEnabled,
        emailScope: existing.emailScope,
        emailFormat: existing.emailFormat,
        desktopEnabled: existing.desktopEnabled,
      };
    }

    const preference = NotificationPreference.createDefault(userId);
    await ctx.notificationPreferenceRepository.save(preference);

    const builtInFilters = [
      NotificationFilter.createBuiltIn({
        userId,
        name: "MENTION",
        notificationType: "MENTION",
      }),
      NotificationFilter.createBuiltIn({
        userId,
        name: "READ_LATER",
        notificationType: "ALL",
      }),
      NotificationFilter.createBuiltIn({
        userId,
        name: "ALL",
        notificationType: "ALL",
      }),
    ];

    for (const { entity: filter } of builtInFilters) {
      await ctx.notificationFilterRepository.save(filter);
    }

    return {
      emailEnabled: preference.emailEnabled,
      emailScope: preference.emailScope,
      emailFormat: preference.emailFormat,
      desktopEnabled: preference.desktopEnabled,
    };
  });
}
