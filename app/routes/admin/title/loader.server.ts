import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import type { TitleItemOutput } from "@/core/application/identity/dto";
import { listTitles } from "@/core/application/identity/listTitles";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type TitlesLoaderData = {
  titles: TitleItemOutput[];
  totalCount: number;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<TitlesLoaderData> {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listTitles({
      container,
      headers: request.headers,
      input: {},
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { titles: result.titles, totalCount: result.totalCount };
}
