import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { SystemPermissionDto } from "@/core/application/access-control/dto";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action";

export { action } from "./action";
export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アクセス権 - OpenDeskシステム管理" }];
}

const PERMISSION_COLUMNS = [
  { key: "includeSubs" as const, label: "継承" },
  { key: "systemAdmin" as const, label: "システム管理" },
  { key: "appGroupViewable" as const, label: "アプリグループ\n閲覧" },
  { key: "appGroupManageable" as const, label: "アプリグループ\n管理" },
  { key: "appCreate" as const, label: "アプリ作成" },
  { key: "appManage" as const, label: "アプリ管理" },
  { key: "spaceCreate" as const, label: "スペース作成" },
  { key: "guestSpaceCreate" as const, label: "ゲストスペース\n作成" },
];

type BooleanPermKeys =
  | "includeSubs"
  | "systemAdmin"
  | "appGroupViewable"
  | "appGroupManageable"
  | "appCreate"
  | "appManage"
  | "spaceCreate"
  | "guestSpaceCreate";

function entityDisplayName(permission: SystemPermissionDto): string {
  if (permission.entity.code === null) return "CREATOR";
  return permission.entity.code;
}

const addSchema = z.object({
  entityType: z.enum(["USER", "GROUP", "ORGANIZATION"]),
  entityCode: z.string().min(1, "コードを入力してください"),
});

export default function AclPage({ loaderData }: Route.ComponentProps) {
  const { permissions } = loaderData;
  const [showAddForm, setShowAddForm] = useState(false);

  const fetcher = useCompositeAction<typeof handlers>();

  const [addForm, addFields] = useForm({
    id: "add-permission-form",
    lastResult:
      fetcher.data?.intent === "addPermission" ? fetcher.data : undefined,
    constraint: getZodConstraint(addSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: addSchema });
    },
  });

  fetcher.register("addPermission", {
    onSuccess: () => {
      toast.success("アクセス権を追加しました");
      setShowAddForm(false);
    },
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "追加に失敗しました"),
  });

  fetcher.register("updatePermission", {
    onSuccess: () => toast.success("アクセス権を更新しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "更新に失敗しました"),
  });

  fetcher.register("deletePermission", {
    onSuccess: () => toast.success("アクセス権を削除しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "削除に失敗しました"),
  });

  const handleCheckboxChange = (
    permission: SystemPermissionDto,
    key: BooleanPermKeys,
    checked: boolean,
  ) => {
    const formData = new FormData();
    formData.set("intent", "updatePermission");
    formData.set("systemPermissionId", permission.systemPermissionId);
    for (const col of PERMISSION_COLUMNS) {
      if (col.key === key) {
        if (checked) formData.set(col.key, "on");
      } else {
        if (permission[col.key]) formData.set(col.key, "on");
      }
    }
    fetcher.submit(formData, { method: "post" });
  };

  const handleDelete = (systemPermissionId: string) => {
    const formData = new FormData();
    formData.set("intent", "deletePermission");
    formData.set("systemPermissionId", systemPermissionId);
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アクセス権
      </h2>
      <p className="mb-md text-sm text-neutral-500">
        OpenDesk全体のアクセス権を設定します。ユーザー/組織/グループ単位で権限を付与できます。
      </p>

      <div className="mb-lg overflow-x-auto">
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-neutral-200 bg-bg-card text-base">
          <thead>
            <tr>
              <th className="min-w-[180px] border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                ユーザー/組織/グループ
              </th>
              {PERMISSION_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="border-b border-neutral-200 bg-bg-section px-md py-sm text-center text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-pre-line"
                >
                  {col.label}
                </th>
              ))}
              <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-center text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr
                key={perm.systemPermissionId}
                className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
              >
                <td className="border-b border-neutral-200 px-md py-sm font-[var(--weight-medium)] text-neutral-800">
                  {entityDisplayName(perm)}
                </td>
                {PERMISSION_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className="border-b border-neutral-200 px-md py-sm text-center align-middle"
                  >
                    <input
                      type="checkbox"
                      checked={perm[col.key]}
                      onChange={(e) =>
                        handleCheckboxChange(perm, col.key, e.target.checked)
                      }
                      className="h-4 w-4 cursor-pointer accent-primary"
                    />
                  </td>
                ))}
                <td className="border-b border-neutral-200 px-md py-sm text-center align-middle">
                  <button
                    type="button"
                    onClick={() => handleDelete(perm.systemPermissionId)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border-none bg-transparent text-neutral-400 transition-colors duration-[var(--transition-default)] hover:bg-error-light hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddForm ? (
        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            ユーザー/組織/グループを追加
          </h3>
          <fetcher.Form method="post" {...getFormProps(addForm)}>
            <input type="hidden" name="intent" value="addPermission" />
            <div className="mb-md flex items-end gap-md">
              <div>
                <label
                  htmlFor={addFields.entityType.id}
                  className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  種別
                </label>
                <select
                  {...getInputProps(addFields.entityType, { type: "text" })}
                  className="h-9 w-[160px] cursor-pointer rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-base text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                >
                  <option value="USER">ユーザー</option>
                  <option value="ORGANIZATION">組織</option>
                  <option value="GROUP">グループ</option>
                </select>
              </div>
              <div className="flex-1">
                <label
                  htmlFor={addFields.entityCode.id}
                  className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  コード
                </label>
                <input
                  {...getInputProps(addFields.entityCode, { type: "text" })}
                  placeholder="例: Everyone"
                  className="h-9 w-full rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-base text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                />
                {addFields.entityCode.errors && (
                  <p className="mt-xs text-sm text-error">
                    {addFields.entityCode.errors}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-md">
              <button
                type="submit"
                disabled={fetcher.isPending("addPermission")}
                className="h-9 rounded-md border-none bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
              >
                {fetcher.isPending("addPermission") ? "追加中..." : "追加"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="h-9 rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                キャンセル
              </button>
            </div>
          </fetcher.Form>
        </div>
      ) : (
        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-xs rounded-md border-none bg-transparent px-sm py-xs text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-lighter focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            ユーザー/組織/グループを追加
          </button>
        </div>
      )}
    </section>
  );
}
