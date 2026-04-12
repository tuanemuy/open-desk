import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type UserItem = {
  userId: string;
  displayName: string;
  loginName: string;
  isActive: boolean;
};

type OrgItem = {
  organizationId: string;
  name: string;
  code: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const url = new URL(request.url);
  const filterParam = url.searchParams.get("filter") ?? "all";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const filterMap: Record<string, boolean | undefined> = {
    all: undefined,
    active: true,
    inactive: false,
  };
  const isActive = filterMap[filterParam];

  const [userResult, organizations] = await Promise.all([
    container.unitOfWorkProvider.transaction(async (ctx) => {
      return ctx.userRepository.list({
        offset,
        limit,
        filter: isActive !== undefined ? { isActive } : undefined,
      });
    }),
    container.unitOfWorkProvider.transaction(async (ctx) => {
      return ctx.organizationRepository.findRoot();
    }),
  ]);

  const users: UserItem[] = userResult.users.map((u) => ({
    userId: u.userId,
    displayName: u.displayName,
    loginName: u.loginName,
    isActive: u.isActive,
  }));

  const orgs: OrgItem[] = organizations.map((o) => ({
    organizationId: o.organizationId,
    name: o.name,
    code: o.code,
  }));

  return {
    users,
    organizations: orgs,
    totalCount: userResult.totalCount,
    filter: filterParam,
    page,
    totalPages: Math.ceil(userResult.totalCount / limit),
  };
}
