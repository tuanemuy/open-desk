import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type GroupItem = {
  groupId: string;
  name: string;
  code: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const groupResult = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.groupRepository.list({ offset: 0, limit: 100 });
    },
  );

  const groups: GroupItem[] = groupResult.groups.map((g) => ({
    groupId: g.groupId,
    name: g.name,
    code: g.code,
  }));

  return { groups, totalCount: groupResult.totalCount };
}
