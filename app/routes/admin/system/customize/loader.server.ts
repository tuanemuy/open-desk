import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { getJsCssCustomization } from "@/core/application/system-settings/getJsCssCustomization";
import type { CustomFile } from "@/core/domain/system-settings/valueObject";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const SCOPE_MAP_TO_UI = {
  ALL_USERS: "all",
  ADMIN_ONLY: "admin",
  DISABLED: "none",
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getJsCssCustomization({
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
    scope: SCOPE_MAP_TO_UI[result.scope] as "all" | "admin" | "none",
    pcJsFiles: result.pcJsFiles as CustomFile[],
    mobileJsFiles: result.mobileJsFiles as CustomFile[],
    pcCssFiles: result.pcCssFiles as CustomFile[],
    mobileCssFiles: result.mobileCssFiles as CustomFile[],
  };
}
