import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { getSystemMail } from "@/core/application/system-settings/getSystemMail";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getSystemMail({
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

  return {
    fromAddress: result.fromAddress,
    serverType: result.serverType,
    externalServer: result.externalServer,
  };
}
