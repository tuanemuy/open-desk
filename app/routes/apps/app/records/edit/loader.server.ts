import { container } from "@/core/application/container/server.instance";
import { getRecord } from "@/core/application/record/getRecord";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import {
  type RankOption,
  type RecordFormAppInfo,
  type RecordFormValues,
  toRecordFormValues,
} from "../form";
import { loadRecordFormBaseData } from "../form.server";
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

  const [{ app, rankOptions }, recordResult] = await Promise.all([
    loadRecordFormBaseData(appId),
    handleUseCase(() =>
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
    ),
  ]);

  return {
    app,
    recordId,
    rankOptions,
    defaultValue: toRecordFormValues(recordResult.record.fieldValues),
    revision: recordResult.record.revision,
  };
}
