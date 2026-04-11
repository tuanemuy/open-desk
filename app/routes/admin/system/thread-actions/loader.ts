import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import type { ThreadActionListOutput } from "@/core/application/space/dto";
import { listThreadActions } from "@/core/application/space/listThreadActions";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type ThreadActionsLoaderData = {
  actions: ThreadActionListOutput["actions"];
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<ThreadActionsLoaderData> {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listThreadActions({
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

  return { actions: result.actions };
}
