import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action";

export { action } from "./action";
export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "組織間のアクセス権 - cybozu.com共通管理 - OpenDesk" }];
}

export default function OrgAccessControlPage({
  loaderData,
}: Route.ComponentProps) {
  const { rules } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const [showCreateForm, setShowCreateForm] = useState(false);

  fetcher.register("createOrgAccessRule", {
    onSuccess: () => {
      toast.success("アクセスルールを追加しました");
      setShowCreateForm(false);
    },
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "追加に失敗しました"),
  });

  fetcher.register("deleteOrgAccessRule", {
    onSuccess: () => toast.success("アクセスルールを削除しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "削除に失敗しました"),
  });

  const accessLevelLabel = (level: string) => {
    if (level === "FULL") return "フルアクセス";
    if (level === "READ_ONLY") return "読み取り専用";
    return "アクセス不可";
  };

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        組織間のアクセス権
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        組織間でのデータアクセス権限を設定します。
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  送信元組織ID
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  送信先組織ID
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  アクセスレベル
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  有効
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr
                  key={rule.orgAccessRuleId}
                  className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                >
                  <td className="px-md py-sm text-sm text-neutral-800">
                    {rule.sourceOrganizationId}
                  </td>
                  <td className="px-md py-sm text-sm text-neutral-800">
                    {rule.targetOrganizationId}
                  </td>
                  <td className="px-md py-sm text-sm text-neutral-800">
                    {accessLevelLabel(rule.accessLevel)}
                  </td>
                  <td className="px-md py-sm text-sm text-neutral-800">
                    {rule.isEnabled ? "有効" : "無効"}
                  </td>
                  <td className="px-md py-sm">
                    <fetcher.Form method="post">
                      <input
                        type="hidden"
                        name="intent"
                        value="deleteOrgAccessRule"
                      />
                      <input
                        type="hidden"
                        name="orgAccessRuleId"
                        value={rule.orgAccessRuleId}
                      />
                      <button
                        type="submit"
                        disabled={fetcher.isPending("deleteOrgAccessRule")}
                        className="bg-transparent text-sm font-[var(--weight-medium)] text-error transition-colors duration-[var(--transition-default)] hover:underline disabled:opacity-50"
                      >
                        削除
                      </button>
                    </fetcher.Form>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-md py-xl text-center text-sm text-neutral-500"
                  >
                    アクセスルールが登録されていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-neutral-200 p-lg">
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-xs bg-transparent text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              <Plus className="h-[14px] w-[14px]" />
              ルールを追加
            </button>
          ) : (
            <fetcher.Form method="post" className="flex flex-col gap-md">
              <input type="hidden" name="intent" value="createOrgAccessRule" />
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="sourceOrganizationId"
                    className="text-sm font-[var(--weight-medium)] text-neutral-700"
                  >
                    送信元組織ID
                  </label>
                  <input
                    type="text"
                    id="sourceOrganizationId"
                    name="sourceOrganizationId"
                    required
                    className="rounded-sm border border-neutral-300 bg-bg-card px-md py-sm font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                    placeholder="組織IDを入力"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="targetOrganizationId"
                    className="text-sm font-[var(--weight-medium)] text-neutral-700"
                  >
                    送信先組織ID
                  </label>
                  <input
                    type="text"
                    id="targetOrganizationId"
                    name="targetOrganizationId"
                    required
                    className="rounded-sm border border-neutral-300 bg-bg-card px-md py-sm font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                    placeholder="組織IDを入力"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label
                    htmlFor="accessLevel"
                    className="text-sm font-[var(--weight-medium)] text-neutral-700"
                  >
                    アクセスレベル
                  </label>
                  <select
                    id="accessLevel"
                    name="accessLevel"
                    required
                    className="rounded-sm border border-neutral-300 bg-bg-card px-md py-sm font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                  >
                    <option value="FULL">フルアクセス</option>
                    <option value="READ_ONLY">読み取り専用</option>
                    <option value="NONE">アクセス不可</option>
                  </select>
                </div>
                <div className="flex items-center gap-sm pt-lg">
                  <input
                    type="checkbox"
                    id="isEnabled"
                    name="isEnabled"
                    value="on"
                    defaultChecked
                    className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                  />
                  <label
                    htmlFor="isEnabled"
                    className="cursor-pointer text-sm text-neutral-800"
                  >
                    有効にする
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-sm">
                <button
                  type="submit"
                  disabled={fetcher.isPending("createOrgAccessRule")}
                  className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                >
                  {fetcher.isPending("createOrgAccessRule")
                    ? "追加中..."
                    : "追加"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="h-[36px] rounded-md border border-neutral-300 bg-transparent px-lg font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[background-color] duration-[var(--transition-default)] hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
                >
                  キャンセル
                </button>
              </div>
            </fetcher.Form>
          )}
        </div>
      </div>
    </section>
  );
}
