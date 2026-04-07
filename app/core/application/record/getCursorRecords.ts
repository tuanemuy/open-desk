import { RecordCursor } from "@/core/domain/record/entity";
import { CursorId } from "@/core/domain/record/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { GetCursorRecordsOutput } from "./dto";
import { toRecordDto } from "./getRecord";

export type GetCursorRecordsInput = {
  readonly cursorId: string;
};

export async function getCursorRecords({
  container,
  input,
}: ServiceArgs<GetCursorRecordsInput>): Promise<GetCursorRecordsOutput> {
  const cursorId = CursorId.create(input.cursorId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const cursor = await ctx.recordCursorRepository.findById(cursorId);
    if (!cursor) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Cursor ${input.cursorId} not found`,
      );
    }

    const now = new Date();

    if (RecordCursor.isExpired(cursor, now)) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Cursor has expired",
      );
    }

    const {
      cursor: advancedCursor,
      offset,
      size,
      hasNext,
    } = RecordCursor.advance(cursor, now);

    const query = cursor.query
      ? container.recordQueryService.parseAndValidate(cursor.query)
      : { condition: null, orderBy: [], limit: size, offset };

    const queryWithPaging = {
      ...query,
      limit: size,
      offset,
    };

    const result = await ctx.recordRepository.findByQuery(
      cursor.appId,
      queryWithPaging,
      cursor.fields.length > 0 ? cursor.fields : undefined,
    );

    if (RecordCursor.isCompleted(advancedCursor)) {
      await ctx.recordCursorRepository.delete(cursorId);
    }

    return {
      records: result.records.map(toRecordDto),
      next: hasNext,
    };
  });
}
