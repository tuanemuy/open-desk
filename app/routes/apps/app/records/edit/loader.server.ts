import { container } from "@/core/application/container/server.instance";
import { getRecord } from "@/core/application/record/getRecord";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import {
  loadRecordFormBaseData,
  toRecordFormValues,
  type RankOption,
  type RecordFormAppInfo,
  type RecordFormValues,
} from "../form";
import type { Route } from "./+types/index";

export type EditRecordLoaderData = {
  app: RecordFormAppInfo;
  recordId: string;
  rankOptions: RankOption[];
  defaultValue: RecordFormValues;
  revision: number;
};

export async function loader({
  params,
  request,
}: Route.LoaderArgs): Promise<EditRecordLoaderData> {
  await requireAuth(request, container);

  const appId = params.appId;
  const recordId = params.recordId;
  const { app, rankOptions } = await loadRecordFormBaseData(appId);

  const recordResult = await handleUseCase(() =>
    getRecord({
      container,
      headers: request.headers,
      input: { appId, recordId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw new Response(e.message, { status: e.status });
    },
  );

  return {
    app,
    recordId,
    rankOptions,
    defaultValue: toRecordFormValues(recordResult.record.fieldValues),
    revision: recordResult.record.revision,
  };
}
