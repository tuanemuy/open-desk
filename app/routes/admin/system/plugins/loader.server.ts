import { data } from "react-router";
import type { PluginDto } from "@/core/application/app/dto";
import { listPlugins } from "@/core/application/app/listPlugins";
import { container } from "@/core/application/container/server.instance";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type PluginsLoaderData = {
  plugins: readonly PluginDto[];
  totalCount: number;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<PluginsLoaderData> {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listPlugins({
      container,
      headers: request.headers,
      input: { operatorId: auth.userId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { plugins: result.plugins, totalCount: result.totalCount };
}
