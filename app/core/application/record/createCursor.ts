import type { AppId } from "@/core/domain/app/valueObject";
import { RecordCursor } from "@/core/domain/record/entity";
import { FieldCode } from "@/core/domain/record/valueObject";
import { ValidationError, ValidationErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { CreateCursorOutput } from "./dto";

const MAX_CURSORS_PER_DOMAIN = 10;

export type CreateCursorInput = {
  readonly appId: string;
  readonly query?: string;
  readonly fields?: readonly string[];
  readonly size?: number;
};

export async function createCursor({
  container,
  input,
}: ServiceArgs<CreateCursorInput>): Promise<CreateCursorOutput> {
  const appId = input.appId as AppId;
  const fields = input.fields?.map((f) => FieldCode.create(f)) ?? [];

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const cursorCount = await ctx.recordCursorRepository.countByDomain();
    if (cursorCount >= MAX_CURSORS_PER_DOMAIN) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        `Cannot create more than ${MAX_CURSORS_PER_DOMAIN} cursors per domain`,
      );
    }

    const totalCount = await ctx.recordRepository.count(
      appId,
      input.query
        ? container.recordQueryService.parseAndValidate(input.query)
        : undefined,
    );

    const cursor = RecordCursor.create({
      appId,
      query: input.query ?? null,
      fields,
      size: input.size,
      totalCount,
    });

    await ctx.recordCursorRepository.create(
      appId,
      cursor.query,
      cursor.fields,
      cursor.size,
    );

    return {
      cursorId: cursor.cursorId,
      totalCount: cursor.totalCount,
    };
  });
}
