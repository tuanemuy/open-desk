import { data } from "react-router";
import type { AppTemplateListOutput } from "@/core/application/app/dto";
import { listAppTemplates } from "@/core/application/app/listAppTemplates";
import { container } from "@/core/application/container/server.instance";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type TemplatesLoaderData = {
  templates: AppTemplateListOutput["templates"];
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<TemplatesLoaderData> {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listAppTemplates({
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

  return { templates: result.templates };
}
