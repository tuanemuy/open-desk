import { CursorId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type DeleteCursorInput = {
  readonly cursorId: string;
};

export async function deleteCursor({
  container,
  input,
}: ServiceArgs<DeleteCursorInput>): Promise<void> {
  const cursorId = CursorId.create(input.cursorId);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const cursor = await ctx.recordCursorRepository.findById(cursorId);
    if (!cursor) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Cursor ${input.cursorId} not found`,
      );
    }

    await ctx.recordCursorRepository.delete(cursorId);
  });
}
