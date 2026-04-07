import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { CsvExportJob } from "@/core/domain/record/entity";
import {
  CsvDelimiter,
  CsvEncoding,
  FieldCode,
} from "@/core/domain/record/valueObject";
import type { ServiceArgs } from "../types";
import type { CsvExportOutput } from "./dto";

export type CsvExportInput = {
  readonly appId: string;
  readonly viewId?: string;
  readonly encoding: string;
  readonly delimiter: string;
  readonly includeHeader: boolean;
  readonly exportFields: readonly string[];
  readonly includeComments?: boolean;
  readonly creatorId: string;
};

export async function csvExport({
  container,
  input,
}: ServiceArgs<CsvExportInput>): Promise<CsvExportOutput> {
  const appId = input.appId as AppId;
  const creatorId = input.creatorId as UserId;
  const encoding = CsvEncoding.create(input.encoding);
  const delimiter = CsvDelimiter.create(input.delimiter);
  const exportFields = input.exportFields.map((f) => FieldCode.create(f));

  const { entity: job } = CsvExportJob.create({
    appId,
    viewId: input.viewId ?? null,
    encoding,
    delimiter,
    includeHeader: input.includeHeader,
    exportFields,
    includeComments: input.includeComments ?? false,
    creatorId,
  });

  const startedJob = CsvExportJob.start(job);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.csvExportJobRepository.save(startedJob);

    return { jobId: job.jobId };
  });
}
