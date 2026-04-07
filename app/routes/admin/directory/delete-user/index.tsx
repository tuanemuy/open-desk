import { Trash2 } from "lucide-react";
import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { deleteUser } from "@/core/application/identity/deleteUser";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
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

const deleteUserSchema = z.object({
  userId: z.string().min(1, "ユーザーIDが必要です"),
});

export const handlers = {
  deleteUser: defineHandler({
    schema: deleteUserSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        deleteUser({
          container,
          headers: args.request.headers,
          input: { userId: value.userId },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ユーザーの一括削除 - cybozu.com共通管理 - OpenDesk" }];
}

export default function DeleteUserPage({ loaderData }: Route.ComponentProps) {
  const { users, totalCount } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ユーザーの一括削除
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        停止中のユーザーを完全に削除します。削除したユーザーは復元できません。（
        {totalCount}件）
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  表示名
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  ログイン名
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  ステータス
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.userId}
                  className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                >
                  <td className="px-md py-sm text-base font-[var(--weight-medium)] text-neutral-800">
                    {user.displayName}
                  </td>
                  <td className="px-md py-sm text-base text-neutral-600">
                    {user.loginName}
                  </td>
                  <td className="px-md py-sm">
                    <span className="inline-flex items-center gap-xs rounded-sm bg-neutral-150 px-sm py-[2px] text-xs font-[var(--weight-medium)] text-neutral-500">
                      停止中
                    </span>
                  </td>
                  <td className="px-md py-sm">
                    <fetcher.Form method="post" className="inline">
                      <input type="hidden" name="intent" value="deleteUser" />
                      <input type="hidden" name="userId" value={user.userId} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-xs bg-transparent text-sm font-[var(--weight-medium)] text-error no-underline transition-colors duration-[var(--transition-default)] hover:underline"
                      >
                        <Trash2 className="h-[12px] w-[12px]" />
                        削除
                      </button>
                    </fetcher.Form>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-md py-xl text-center text-sm text-neutral-500"
                  >
                    削除対象のユーザーがいません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
