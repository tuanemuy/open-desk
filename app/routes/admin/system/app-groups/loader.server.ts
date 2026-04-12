import { data } from "react-router";
import type { AppGroupListOutput } from "@/core/application/app/dto";
import { listAppGroups } from "@/core/application/app/listAppGroups";
import { container } from "@/core/application/container/server.instance";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type AppGroupsLoaderData = {
  groups: AppGroupListOutput["groups"];
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<AppGroupsLoaderData> {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listAppGroups({
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

  return { groups: result.groups };
}
