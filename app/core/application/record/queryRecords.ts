import type { AppId } from "@/core/domain/app/valueObject";
import type {
  QueryExecutionContext,
  RecordQuery,
} from "@/core/domain/record/valueObject";
import { FieldCode } from "@/core/domain/record/valueObject";
import type { ServiceArgs } from "../types";
import type { QueryRecordOutput } from "./dto";
import { toRecordDto } from "./getRecord";

export type QueryRecordsInput = {
  readonly appId: string;
  readonly query?: string;
  readonly fields?: readonly string[];
  readonly totalCount?: boolean;
  readonly executionContext: QueryExecutionContext;
};

export async function queryRecords({
  container,
  input,
}: ServiceArgs<QueryRecordsInput>): Promise<QueryRecordOutput> {
  const appId = input.appId as AppId;
  const fields = input.fields?.map((f) => FieldCode.create(f));

  let resolvedQuery: RecordQuery = {
    condition: null,
    orderBy: [],
    limit: null,
    offset: null,
  };

  if (input.query) {
    const parsed = container.recordQueryService.parseAndValidate(input.query);
    resolvedQuery = container.recordQueryService.resolveFunctions(
      parsed,
      input.executionContext,
    );
  }

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const result = await ctx.recordRepository.findByQuery(
      appId,
      resolvedQuery,
      fields,
      input.totalCount,
    );

    return {
      records: result.records.map(toRecordDto),
      totalCount: result.totalCount,
    };
  });
}
