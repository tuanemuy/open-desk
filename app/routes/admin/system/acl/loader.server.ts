import { data } from "react-router";
import type { SystemPermissionDto } from "@/core/application/access-control/dto";
import { listSystemPermissions } from "@/core/application/access-control/listSystemPermissions";
import { container } from "@/core/application/container/server.instance";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type AclLoaderData = {
  permissions: readonly SystemPermissionDto[];
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<AclLoaderData> {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listSystemPermissions({
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

  return { permissions: result.permissions };
}
