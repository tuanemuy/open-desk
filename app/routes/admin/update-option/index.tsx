import { data } from "react-router";
import { toast } from "sonner";
import { container } from "@/core/application/container/server.instance";
import { getUpdateOption } from "@/core/application/system-settings/getUpdateOption";
import { useCompositeAction } from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";

export { action } from "./action.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getUpdateOption({
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
    channel: result.channel,
    disabledFeatures: result.disabledFeatures,
    disabledLatestOnlyFeatures: result.disabledLatestOnlyFeatures,
    earlyAccessFeatures: result.earlyAccessFeatures,
    experimentalFeatures: result.experimentalFeatures,
    apiLabFeatures: result.apiLabFeatures,
  };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アップデートオプション - cybozu.com共通管理 - OpenDesk" }];
}

export default function UpdateOptionPage({ loaderData }: Route.ComponentProps) {
  const {
    channel,
    disabledFeatures,
    disabledLatestOnlyFeatures,
    earlyAccessFeatures,
    experimentalFeatures,
    apiLabFeatures,
  } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("save", {
    onSuccess: () => toast.success("保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アップデートオプション
      </h2>

      <fetcher.Form
        method="post"
        className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg"
      >
        <input type="hidden" name="intent" value="save" />
        <input
          type="hidden"
          name="disabledFeatures"
          value={JSON.stringify(disabledFeatures)}
        />
        <input
          type="hidden"
          name="disabledLatestOnlyFeatures"
          value={JSON.stringify(disabledLatestOnlyFeatures)}
        />
        <input
          type="hidden"
          name="earlyAccessFeatures"
          value={JSON.stringify(earlyAccessFeatures)}
        />
        <input
          type="hidden"
          name="experimentalFeatures"
          value={JSON.stringify(experimentalFeatures)}
        />
        <input
          type="hidden"
          name="apiLabFeatures"
          value={JSON.stringify(apiLabFeatures)}
        />

        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            自動アップデート
          </div>
          <div className="flex flex-col gap-md">
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="channel"
                value="LATEST"
                defaultChecked={channel === "LATEST"}
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">
                自動的にアップデートする（推奨）
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="channel"
                value="MONTHLY"
                defaultChecked={channel === "MONTHLY"}
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">
                アップデートの通知のみ受け取る
              </span>
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
