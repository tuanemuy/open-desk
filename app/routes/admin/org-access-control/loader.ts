import { data } from "react-router";
import type { OrgAccessRuleDto } from "@/core/application/access-control/dto";
import { listOrgAccessRules } from "@/core/application/access-control/listOrgAccessRules";
import { container } from "@/core/application/container/server.instance";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type OrgAccessControlLoaderData = {
  rules: readonly OrgAccessRuleDto[];
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<OrgAccessControlLoaderData> {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listOrgAccessRules({
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

  return { rules: result.rules };
}
