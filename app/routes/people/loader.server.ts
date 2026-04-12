import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type UserProfile = {
  id: string;
  name: string;
  initial: string;
  email: string;
  isSelf: boolean;
};

export type PeopleLoaderData = {
  users: UserProfile[];
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<PeopleLoaderData> {
  const auth = await requireAuth(request, container);

  const userList = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.list({
        offset: 0,
        limit: 100,
        filter: { isActive: true },
      });
    },
  );

  const users: UserProfile[] = userList.users.map((u) => ({
    id: u.userId as string,
    name: u.displayName as string,
    initial: (u.displayName as string).charAt(0),
    email: u.email as string,
    isSelf: u.userId === auth.userId,
  }));

  return { users };
}
