import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import type { LoginSecurityOutput } from "@/core/application/system-settings/dto";
import { getLoginSecurity } from "@/core/application/system-settings/getLoginSecurity";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type LoginSecurityLoaderData = {
  settings: LoginSecurityOutput;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<LoginSecurityLoaderData> {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getLoginSecurity({
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

  return { settings: result };
}
