import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import type { ProvisioningConfigOutput } from "@/core/application/identity/dto";
import { getProvisioningConfig } from "@/core/application/identity/getProvisioningConfig";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type ProvisioningLoaderData = {
  config: ProvisioningConfigOutput;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<ProvisioningLoaderData> {
  await requireAuth(request, container);

  const config = await handleUseCase(() =>
    getProvisioningConfig({
      container,
      headers: request.headers,
      input: undefined,
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { config };
}
