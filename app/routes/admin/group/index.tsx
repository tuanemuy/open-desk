import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { createGroup } from "@/core/application/identity/createGroup";
import { deleteGroup } from "@/core/application/identity/deleteGroup";
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

const createGroupSchema = z.object({
  name: z.string().min(1, "グループ名を入力してください"),
  code: z.string().min(1, "グループコードを入力してください"),
});

const deleteGroupSchema = z.object({
  groupId: z.string().min(1),
});

export const handlers = {
  createGroup: defineHandler({
    schema: createGroupSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        createGroup({
          container,
          headers: args.request.headers,
          input: value,
        }),
      ).match(
        (result) => success({ groupId: result.groupId }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteGroup: defineHandler({
    schema: deleteGroupSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        deleteGroup({
          container,
          headers: args.request.headers,
          input: { groupId: value.groupId },
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
  return [
    {
      title: "グループ（ロール） - cybozu.com共通管理 - OpenDesk",
    },
  ];
}

export default function GroupPage({ loaderData }: Route.ComponentProps) {
  const { groups, totalCount } = loaderData;
  const [showCreate, setShowCreate] = useState(false);
  const fetcher = useCompositeAction<typeof handlers>();

  const [createForm, createFields] = useForm({
    id: "create-group-form",
    lastResult:
      fetcher.data?.intent === "createGroup" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.createGroup.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.createGroup.schema });
    },
  });

  const isCreating = fetcher.isPending("createGroup");

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        グループ（ロール）
      </h2>

      <div className="mb-lg">
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex h-[36px] items-center gap-sm rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus className="h-[14px] w-[14px]" />
          グループの追加
        </button>
      </div>

      {showCreate && (
        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            グループの追加
          </h3>
          <fetcher.Form method="post" {...getFormProps(createForm)}>
            <input type="hidden" name="intent" value="createGroup" />
            <div className="mb-md flex gap-md">
              <div className="flex flex-1 flex-col gap-xs">
                <label
                  htmlFor={createFields.name.id}
                  className="text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  グループ名
                </label>
                <input
                  {...getInputProps(createFields.name, { type: "text" })}
                  className="h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                />
                {createFields.name.errors && (
                  <p className="text-xs text-error">
                    {createFields.name.errors}
                  </p>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-xs">
                <label
                  htmlFor={createFields.code.id}
                  className="text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  グループコード
                </label>
                <input
                  {...getInputProps(createFields.code, { type: "text" })}
                  className="h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                />
                {createFields.code.errors && (
                  <p className="text-xs text-error">
                    {createFields.code.errors}
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {isCreating ? "作成中..." : "作成"}
            </button>
          </fetcher.Form>
        </div>
      )}

      <p className="mb-md text-sm text-neutral-500">{totalCount}件のグループ</p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  グループ名
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  コード
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr
                  key={group.groupId}
                  className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                >
                  <td className="px-md py-sm text-base font-[var(--weight-medium)] text-neutral-800">
                    {group.name}
                  </td>
                  <td className="px-md py-sm text-sm text-neutral-600">
                    {group.code}
                  </td>
                  <td className="px-md py-sm">
                    <fetcher.Form method="post" className="inline">
                      <input type="hidden" name="intent" value="deleteGroup" />
                      <input
                        type="hidden"
                        name="groupId"
                        value={group.groupId}
                      />
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
              {groups.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-md py-xl text-center text-sm text-neutral-500"
                  >
                    グループがありません
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
