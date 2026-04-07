import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "スマートフォンでの表示 - OpenDeskシステム管理" }];
}

const schema = z.object({
  displayMode: z.enum(["mobile", "pc"]),
  allowUserSwitch: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export const handlers = {
  updateMobile: defineHandler({
    schema,
    handler: async (_value, args) => {
      await requireAuth(args.request, container);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {
    displayMode: "mobile" as "mobile" | "pc",
    allowUserSwitch: true,
  };
}

export default function MobilePage({ loaderData }: Route.ComponentProps) {
  const { displayMode: initialMode, allowUserSwitch: initialAllowSwitch } =
    loaderData;
  const [displayMode, setDisplayMode] = useState(initialMode);
  const [allowUserSwitch, setAllowUserSwitch] = useState(initialAllowSwitch);

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "mobile-form",
    lastResult:
      fetcher.data?.intent === "updateMobile" ? fetcher.data : undefined,
    constraint: getZodConstraint(schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  fetcher.register("updateMobile", {
    onSuccess: () => toast.success("設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateMobile");

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        スマートフォンでの表示
      </h2>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="updateMobile" />

        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <div className="mb-lg">
            <div className="mb-md text-sm font-[var(--weight-medium)] text-neutral-600">
              表示モード
            </div>
            <div className="flex flex-col gap-sm">
              <label className="flex items-center gap-sm">
                <input
                  type="radio"
                  name="displayMode"
                  value="mobile"
                  checked={displayMode === "mobile"}
                  onChange={() => setDisplayMode("mobile")}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <span className="cursor-pointer text-base text-neutral-800 select-none">
                  モバイル版を表示する
                </span>
              </label>
              <label className="flex items-center gap-sm">
                <input
                  type="radio"
                  name="displayMode"
                  value="pc"
                  checked={displayMode === "pc"}
                  onChange={() => setDisplayMode("pc")}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <span className="cursor-pointer text-base text-neutral-800 select-none">
                  PC版を表示する
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-md py-sm">
            <input
              type="checkbox"
              id="allow-switch"
              name="allowUserSwitch"
              checked={allowUserSwitch}
              onChange={() => setAllowUserSwitch(!allowUserSwitch)}
              className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
            />
            <label
              htmlFor="allow-switch"
              className="cursor-pointer text-base text-neutral-800 select-none"
            >
              ユーザー自身による表示の切り替えを許可する
            </label>
          </div>
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
            onClick={() => {
              setDisplayMode(initialMode);
              setAllowUserSwitch(initialAllowSwitch);
            }}
            className="h-9 rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            キャンセル
          </button>
        </div>
      </fetcher.Form>
    </section>
  );
}
