import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { data } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { getGuestAuth } from "@/core/application/system-settings/getGuestAuth";
import { updateGuestAuth } from "@/core/application/system-settings/updateGuestAuth";
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

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ゲストユーザーの認証 - OpenDeskシステム管理" }];
}

const schema = z.object({
  twoFactorEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export const handlers = {
  updateGuestAuth: defineHandler({
    schema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        updateGuestAuth({
          container,
          headers: args.request.headers,
          input: { twoFactorEnabled: value.twoFactorEnabled },
        }),
      ).match(
        (result) => success({ data: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getGuestAuth({ container, headers: request.headers, input: undefined }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { twoFactorEnabled: result.twoFactorEnabled };
}

export default function GuestAuthPage({ loaderData }: Route.ComponentProps) {
  const { twoFactorEnabled: initial } = loaderData;
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initial);

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "guest-auth-form",
    lastResult:
      fetcher.data?.intent === "updateGuestAuth" ? fetcher.data : undefined,
    constraint: getZodConstraint(schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  fetcher.register("updateGuestAuth", {
    onSuccess: () => toast.success("設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateGuestAuth");

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ゲストユーザーの認証
      </h2>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="updateGuestAuth" />

        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <div className="flex items-center gap-md py-sm">
            <input
              type="checkbox"
              id="two-factor"
              name="twoFactorEnabled"
              checked={twoFactorEnabled}
              onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
            />
            <label
              htmlFor="two-factor"
              className="cursor-pointer text-base text-neutral-800 select-none"
            >
              ゲストユーザーの認証に二段階認証を利用する
            </label>
          </div>
          <p className="pl-[calc(var(--space-md)+16px)] text-sm text-neutral-500">
            有効にすると、ゲストユーザーのログイン時にメールで確認コードを送信します。
          </p>
        </div>

        <div className="flex items-center gap-md">
          <button
            type="submit"
            disabled={isPending}
            className="h-9 rounded-md border-none bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {isPending ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => setTwoFactorEnabled(initial)}
            className="h-9 rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            キャンセル
          </button>
        </div>
      </fetcher.Form>
    </section>
  );
}
