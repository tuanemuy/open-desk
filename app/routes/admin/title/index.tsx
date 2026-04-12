import { toast } from "sonner";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "役職 - cybozu.com共通管理 - OpenDesk" }];
}

export default function TitlePage({ loaderData }: Route.ComponentProps) {
  const { titles } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("deleteTitle", {
    onSuccess: () => toast.success("役職を削除しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "削除に失敗しました"),
  });

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        役職
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        組織で使用する役職を管理します。
      </p>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  役職名
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {titles.map((title) => (
                <tr
                  key={title.titleId}
                  className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                >
                  <td className="px-md py-sm text-base text-neutral-800">
                    {title.name}
                  </td>
                  <td className="px-md py-sm">
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="deleteTitle" />
                      <input
                        type="hidden"
                        name="titleId"
                        value={title.titleId}
                      />
                      <button
                        type="submit"
                        disabled={fetcher.isPending("deleteTitle")}
                        className="bg-transparent text-sm font-[var(--weight-medium)] text-error transition-colors duration-[var(--transition-default)] hover:underline disabled:opacity-50"
                      >
                        削除
                      </button>
                    </fetcher.Form>
                  </td>
                </tr>
              ))}
              {titles.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-md py-xl text-center text-sm text-neutral-500"
                  >
                    役職が登録されていません
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
