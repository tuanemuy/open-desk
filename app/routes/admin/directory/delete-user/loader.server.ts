import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type UserItem = {
  userId: string;
  displayName: string;
  loginName: string;
  isActive: boolean;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const userResult = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.list({
        offset: 0,
        limit: 100,
        filter: { isActive: false },
      });
    },
  );

  const users: UserItem[] = userResult.users.map((u) => ({
    userId: u.userId,
    displayName: u.displayName,
    loginName: u.loginName,
    isActive: u.isActive,
  }));

  return { users, totalCount: userResult.totalCount };
}
