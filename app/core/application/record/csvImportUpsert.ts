import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { CsvImportJob } from "@/core/domain/record/entity";
import type { FieldMapping } from "@/core/domain/record/valueObject";
import {
  CsvDelimiter,
  CsvEncoding,
  ErrorHandling,
  FieldCode,
  ImportMode,
} from "@/core/domain/record/valueObject";
import type { ServiceArgs } from "../types";
import type { CsvImportOutput } from "./dto";

export type CsvImportUpsertInput = {
  readonly appId: string;
  readonly fileName: string;
  readonly fileContent: ArrayBuffer;
  readonly fileSize: number;
  readonly encoding: string;
  readonly delimiter: string;
  readonly errorHandling: string;
  readonly fieldMappings: readonly {
    readonly appFieldCode: string;
    readonly fileColumn: string;
    readonly dateFormat: string | null;
  }[];
  readonly updateKey: string;
  readonly creatorId: string;
};

export async function csvImportUpsert({
  container,
  input,
}: ServiceArgs<CsvImportUpsertInput>): Promise<CsvImportOutput> {
  const appId = input.appId as AppId;
  const creatorId = input.creatorId as UserId;
  const encoding = CsvEncoding.create(input.encoding);
  const delimiter = CsvDelimiter.create(input.delimiter);
  const errorHandling = ErrorHandling.create(input.errorHandling);
  const updateKey = FieldCode.create(input.updateKey);
  const fieldMappings: FieldMapping[] = input.fieldMappings.map((m) => ({
    appFieldCode: FieldCode.create(m.appFieldCode),
    fileColumn: m.fileColumn,
    dateFormat: m.dateFormat,
  }));

  const { entity: job } = CsvImportJob.create({
    appId,
    fileName: input.fileName,
    fileSize: input.fileSize,
    encoding,
    delimiter,
    importMode: ImportMode.Upsert,
    updateKey,
    errorHandling,
    fieldMappings,
    creatorId,
  });

  CsvImportJob.validateUpdateKey(job);

  const isExcelFormat =
    input.fileName.endsWith(".xlsx") || input.fileName.endsWith(".xls");
  const startedJob = CsvImportJob.start(job, isExcelFormat, 0);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.csvImportJobRepository.save(startedJob);

    const completedJob = await container.csvImportService.processImport(
      startedJob,
      input.fileContent,
    );

    await ctx.csvImportJobRepository.save(completedJob);

    return { jobId: job.jobId };
  });
}
