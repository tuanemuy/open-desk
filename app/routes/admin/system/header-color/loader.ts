import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { getHeaderColor } from "@/core/application/system-settings/getHeaderColor";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type HeaderColorLoaderData = {
  currentColor: string;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<HeaderColorLoaderData> {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getHeaderColor({ container, headers: request.headers, input: undefined }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { currentColor: result.hex };
}
