import { data } from "react-router";
import { toast } from "sonner";
import { container } from "@/core/application/container/server.instance";
import { getAccessRestriction } from "@/core/application/system-settings/getAccessRestriction";
import { useCompositeAction } from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";

export { action } from "./action.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getAccessRestriction({
      container,
      headers: request.headers,
      input: undefined,
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return {
    ipRestrictionEnabled: result.ipRestrictionEnabled,
    allowedIps: result.allowedIps,
    basicAuthEnabled: result.basicAuthEnabled,
    basicAuthUsername: result.basicAuthUsername,
  };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アクセス制限 - cybozu.com共通管理 - OpenDesk" }];
}

export default function NetworkSecurityPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    ipRestrictionEnabled,
    allowedIps,
    basicAuthEnabled,
    basicAuthUsername,
  } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("save", {
    onSuccess: () => toast.success("保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const ipAllowListDefault = allowedIps.map((ip) => ip.cidr).join("\n");

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アクセス制限
      </h2>

      <fetcher.Form
        method="post"
        className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg"
      >
        <input type="hidden" name="intent" value="save" />

        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            IPアドレス制限
          </div>
          <div className="mb-md text-sm leading-normal text-neutral-500">
            接続元のIPアドレスによりアクセスを制限します。許可するIPアドレスまたはCIDRを1行に1つずつ入力してください。
          </div>
          <div className="mb-md flex items-start gap-sm">
            <input
              type="checkbox"
              id="ip-restriction"
              name="ipRestriction"
              value="on"
              defaultChecked={ipRestrictionEnabled}
              className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
            />
            <label
              htmlFor="ip-restriction"
              className="cursor-pointer text-base leading-normal text-neutral-800"
            >
              IPアドレス制限を有効にする
            </label>
          </div>
          <textarea
            name="ipAllowList"
            rows={5}
            defaultValue={ipAllowListDefault}
            placeholder="例: 192.168.1.0/24"
            className="w-full rounded-sm border border-neutral-300 bg-bg-card p-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
          />
        </div>

        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            Basic認証
          </div>
          <div className="mb-md text-sm leading-normal text-neutral-500">
            制限されたIPアドレスからのアクセスに対してBasic認証を要求します。
          </div>
          <div className="flex items-start gap-sm">
            <input
              type="checkbox"
              id="basic-auth"
              name="basicAuth"
              value="on"
              defaultChecked={basicAuthEnabled}
              className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
            />
            <label
              htmlFor="basic-auth"
              className="cursor-pointer text-base leading-normal text-neutral-800"
            >
              Basic認証を有効にする
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={fetcher.isPending("save")}
          className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {fetcher.isPending("save") ? "保存中..." : "保存"}
        </button>
      </fetcher.Form>
    </section>
  );
}
