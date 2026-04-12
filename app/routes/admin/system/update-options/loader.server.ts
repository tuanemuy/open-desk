import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { getUpdateOption } from "@/core/application/system-settings/getUpdateOption";
import type { FeatureToggle } from "@/core/domain/system-settings/valueObject";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type FeatureOption = {
  id: string;
  label: string;
  enabled: boolean;
  expiry: string | null;
};

function toFeatureOptions(toggles: readonly FeatureToggle[]): FeatureOption[] {
  return toggles.map((t) => ({
    id: t.featureId,
    label: t.name,
    enabled: t.enabled,
    expiry: t.expiresAt ? t.expiresAt.toISOString().slice(0, 10) : null,
  }));
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getUpdateOption({ container, headers: request.headers, input: undefined }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    channel: (result.channel === "LATEST" ? "latest" : "monthly") as
      | "latest"
      | "monthly",
    monthlyFeatures: toFeatureOptions(result.disabledFeatures),
    latestFeatures: toFeatureOptions(result.disabledLatestOnlyFeatures),
    previewFeatures: toFeatureOptions(result.earlyAccessFeatures),
    experimentalFeatures: toFeatureOptions(result.experimentalFeatures),
    apiLab: toFeatureOptions(result.apiLabFeatures),
  };
}
