import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { activateUser } from "@/core/application/identity/activateUser";
import {
  type CreateOrganizationInput,
  createOrganization,
} from "@/core/application/identity/createOrganization";
import { createUser } from "@/core/application/identity/createUser";
import { deactivateUser } from "@/core/application/identity/deactivateUser";
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

const createUserSchema = z.object({
  loginName: z.string().min(1, "ログイン名を入力してください"),
  displayName: z.string().min(1, "表示名を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

const createOrgSchema = z.object({
  name: z.string().min(1, "組織名を入力してください"),
  code: z.string().min(1, "組織コードを入力してください"),
  parentOrganizationId: z.string().optional(),
});

const toggleUserStatusSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["activate", "deactivate"]),
});

export const handlers = {
  createUser: defineHandler({
    schema: createUserSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        createUser({
          container,
          headers: args.request.headers,
          input: value,
        }),
      ).match(
        (result) => success({ userId: result.userId }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  createOrganization: defineHandler({
    schema: createOrgSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      const input: CreateOrganizationInput = {
        name: value.name,
        code: value.code,
        parentOrganizationId: value.parentOrganizationId || undefined,
      };
      return handleUseCase(() =>
        createOrganization({
          container,
          headers: args.request.headers,
          input,
        }),
      ).match(
        (result) => success({ organizationId: result.organizationId }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  toggleUserStatus: defineHandler({
    schema: toggleUserStatusSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      const fn = value.action === "activate" ? activateUser : deactivateUser;
      return handleUseCase(() =>
        fn({
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
  return [{ title: "組織/ユーザー - cybozu.com共通管理 - OpenDesk" }];
}

export default function DirectoryPage({ loaderData }: Route.ComponentProps) {
  const { users, organizations, totalCount, filter, page, totalPages } =
    loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  const fetcher = useCompositeAction<typeof handlers>();

  const [createUserForm, createUserFields] = useForm({
    id: "create-user-form",
    lastResult:
      fetcher.data?.intent === "createUser" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.createUser.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.createUser.schema });
    },
  });

  const [createOrgForm, createOrgFields] = useForm({
    id: "create-org-form",
    lastResult:
      fetcher.data?.intent === "createOrganization" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.createOrganization.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.createOrganization.schema,
      });
    },
  });

  const isCreatingUser = fetcher.isPending("createUser");
  const isCreatingOrg = fetcher.isPending("createOrganization");

  const handleFilterChange = (newFilter: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", newFilter);
    params.delete("page");
    setSearchParams(params);
  };

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        組織/ユーザー
      </h2>

      {/* Action Links */}
      <div className="mb-lg flex flex-wrap items-center gap-md">
        <button
          type="button"
          onClick={() => setShowCreateOrg(!showCreateOrg)}
          className="inline-flex h-[36px] items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-lg font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus className="h-[14px] w-[14px]" />
          組織の追加
        </button>
        <button
          type="button"
          onClick={() => setShowCreateUser(!showCreateUser)}
          className="inline-flex h-[36px] items-center gap-sm rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <UserPlus className="h-[14px] w-[14px]" />
          ユーザーの追加
        </button>
      </div>

      {/* Create Organization Form */}
      {showCreateOrg && (
        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            組織の追加
          </h3>
          <fetcher.Form method="post" {...getFormProps(createOrgForm)}>
            <input type="hidden" name="intent" value="createOrganization" />
            <div className="mb-md flex flex-col gap-xs">
              <label
                htmlFor={createOrgFields.name.id}
                className="text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                組織名
              </label>
              <input
                {...getInputProps(createOrgFields.name, { type: "text" })}
                className="h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              />
              {createOrgFields.name.errors && (
                <p className="text-xs text-error">
                  {createOrgFields.name.errors}
                </p>
              )}
            </div>
            <div className="mb-md flex flex-col gap-xs">
              <label
                htmlFor={createOrgFields.code.id}
                className="text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                組織コード
              </label>
              <input
                {...getInputProps(createOrgFields.code, { type: "text" })}
                className="h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              />
              {createOrgFields.code.errors && (
                <p className="text-xs text-error">
                  {createOrgFields.code.errors}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isCreatingOrg}
              className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {isCreatingOrg ? "作成中..." : "作成"}
            </button>
          </fetcher.Form>
        </div>
      )}

      {/* Create User Form */}
      {showCreateUser && (
        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            ユーザーの追加
          </h3>
          <fetcher.Form method="post" {...getFormProps(createUserForm)}>
            <input type="hidden" name="intent" value="createUser" />
            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label
                  htmlFor={createUserFields.loginName.id}
                  className="text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  ログイン名
                </label>
                <input
                  {...getInputProps(createUserFields.loginName, {
                    type: "text",
                  })}
                  className="h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                />
                {createUserFields.loginName.errors && (
                  <p className="text-xs text-error">
                    {createUserFields.loginName.errors}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-xs">
                <label
                  htmlFor={createUserFields.displayName.id}
                  className="text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  表示名
                </label>
                <input
                  {...getInputProps(createUserFields.displayName, {
                    type: "text",
                  })}
                  className="h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                />
                {createUserFields.displayName.errors && (
                  <p className="text-xs text-error">
                    {createUserFields.displayName.errors}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-xs">
                <label
                  htmlFor={createUserFields.email.id}
                  className="text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  メールアドレス
                </label>
                <input
                  {...getInputProps(createUserFields.email, { type: "email" })}
                  className="h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                />
                {createUserFields.email.errors && (
                  <p className="text-xs text-error">
                    {createUserFields.email.errors}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-xs">
                <label
                  htmlFor={createUserFields.password.id}
                  className="text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  パスワード
                </label>
                <input
                  {...getInputProps(createUserFields.password, {
                    type: "password",
                  })}
                  className="h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                />
                {createUserFields.password.errors && (
                  <p className="text-xs text-error">
                    {createUserFields.password.errors}
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={isCreatingUser}
              className="mt-md h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {isCreatingUser ? "作成中..." : "作成"}
            </button>
          </fetcher.Form>
        </div>
      )}

      {/* Organization Tree */}
      {organizations.length > 0 && (
        <div className="mb-lg">
          <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            組織
          </h3>
          <div className="rounded-lg border border-neutral-200 bg-bg-card">
            {organizations.map((org) => (
              <div
                key={org.organizationId}
                className="border-b border-neutral-200 px-lg py-sm last:border-b-0"
              >
                <span className="text-base font-[var(--weight-medium)] text-neutral-800">
                  {org.name}
                </span>
                <span className="ml-sm text-sm text-neutral-500">
                  ({org.code})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Filter */}
      <div className="mb-md flex items-center justify-between">
        <h3 className="font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
          ユーザー一覧
          <span className="ml-sm text-sm font-[var(--weight-normal)] text-neutral-500">
            （{totalCount}件）
          </span>
        </h3>
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="h-[34px] min-w-[200px] cursor-pointer appearance-none rounded-sm border border-neutral-300 bg-bg-card bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[right_10px_center] bg-no-repeat px-md pr-xl font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
        >
          <option value="all">すべてのユーザー</option>
          <option value="active">使用中のユーザー</option>
          <option value="inactive">停止中のユーザー</option>
        </select>
      </div>

      {/* User Table */}
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
                    <span
                      className={`inline-flex items-center gap-xs rounded-sm px-sm py-[2px] text-xs font-[var(--weight-medium)] ${
                        user.isActive
                          ? "bg-success-light text-success"
                          : "bg-neutral-150 text-neutral-500"
                      }`}
                    >
                      {user.isActive ? "使用中" : "停止中"}
                    </span>
                  </td>
                  <td className="px-md py-sm">
                    <fetcher.Form method="post" className="inline">
                      <input
                        type="hidden"
                        name="intent"
                        value="toggleUserStatus"
                      />
                      <input type="hidden" name="userId" value={user.userId} />
                      <input
                        type="hidden"
                        name="action"
                        value={user.isActive ? "deactivate" : "activate"}
                      />
                      <button
                        type="submit"
                        className="bg-transparent text-sm font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                      >
                        {user.isActive ? "停止" : "有効化"}
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
                    ユーザーが見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-lg flex items-center justify-center gap-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                to={`/admin/directory?filter=${filter}&page=${pageNum}`}
                className={`inline-flex h-[32px] w-[32px] items-center justify-center rounded-md text-sm no-underline transition-[color,background-color] duration-[var(--transition-default)] ${
                  pageNum === page
                    ? "bg-primary font-[var(--weight-medium)] text-on-primary"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {pageNum}
              </Link>
            ),
          )}
        </div>
      )}
    </section>
  );
}
