import { container } from "@/core/application/container/server.instance";
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

export async function loader({
  request,
}: Route.LoaderArgs): Promise<FeaturesLoaderData> {
  await requireAuth(request, container);

  return {
    features: {
      emailEnabled: true,
      emailDefaultReceive: "self",
      emailFormat: "html",
      emailPersonalChange: true,
      emailApiNotify: false,
      spaceEnabled: true,
      spaceStandaloneApp: true,
      guestSpaceEnabled: true,
      peopleMessageEnabled: true,
      dashboardEnabled: true,
    },
  };
}
