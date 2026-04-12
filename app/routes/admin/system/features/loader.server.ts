import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import type { FeatureFlagsOutput } from "@/core/application/system-settings/dto";
import { getFeatureFlags } from "@/core/application/system-settings/getFeatureFlags";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type FeatureSettings = {
  emailEnabled: boolean;
  emailDefaultReceive: "self" | "none";
  emailFormat: "html" | "text";
  emailPersonalChange: boolean;
  emailApiNotify: boolean;
  spaceEnabled: boolean;
  spaceStandaloneApp: boolean;
  guestSpaceEnabled: boolean;
  peopleMessageEnabled: boolean;
  dashboardEnabled: boolean;
};

export type FeaturesLoaderData = {
  features: FeatureSettings;
};

function toFeatureSettings(flags: FeatureFlagsOutput): FeatureSettings {
  return {
    emailEnabled: flags.emailNotification.enabled,
    emailDefaultReceive:
      flags.emailNotification.defaultReceive === "SELF_ONLY" ? "self" : "none",
    emailFormat: flags.emailNotification.format === "HTML" ? "html" : "text",
    emailPersonalChange: flags.emailNotification.allowUserFormatChange,
    emailApiNotify: flags.emailNotification.notifyRestApi,
    spaceEnabled: flags.space.enabled,
    spaceStandaloneApp: flags.space.allowStandaloneApp,
    guestSpaceEnabled: flags.guestSpace.enabled,
    peopleMessageEnabled: flags.peopleAndMessage.enabled,
    dashboardEnabled: flags.usageDashboard.enabled,
  };
}

export async function loader({
  request,
}: Route.LoaderArgs): Promise<FeaturesLoaderData> {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getFeatureFlags({ container, headers: request.headers, input: undefined }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { features: toFeatureSettings(result) };
}
