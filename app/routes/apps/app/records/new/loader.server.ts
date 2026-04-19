import { container } from "@/core/application/container/server.instance";
import { reuseRecord } from "@/core/application/record/reuseRecord";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import {
  emptyRecordFormValues,
  type RankOption,
  type RecordFormAppInfo,
  type RecordFormValues,
  toRecordFormValues,
} from "../form";
import { loadRecordFormBaseData } from "../form.server";
import type { Route } from "./+types/index";

export type NewRecordLoaderData = {
  app: RecordFormAppInfo;
  rankOptions: RankOption[];
  defaultValue: RecordFormValues;
};

export async function loader({
  params,
  request,
}: Route.LoaderArgs): Promise<NewRecordLoaderData> {
  const auth = await requireAuth(request, container);

  const appId = params.appId;
  const reuseRecordId = new URL(request.url).searchParams.get("reuseRecordId");

  const baseDataPromise = loadRecordFormBaseData(appId);

  if (!reuseRecordId) {
    const { app, rankOptions } = await baseDataPromise;
    return {
      app,
      rankOptions,
      defaultValue: emptyRecordFormValues(),
    };
  }

  const [{ app, rankOptions }, reuseResult] = await Promise.all([
    baseDataPromise,
    handleUseCase(() =>
      reuseRecord({
        container,
        headers: request.headers,
        input: {
          appId,
          recordId: reuseRecordId,
          creatorId: auth.userId as string,
        },
      }),
    ).match(
      (result) => result,
      (e) => {
        throw new Response(e.message, { status: e.status });
      },
    ),
  ]);

  return {
    app,
    rankOptions,
    defaultValue: toRecordFormValues(reuseResult.fieldValues),
  };
}
