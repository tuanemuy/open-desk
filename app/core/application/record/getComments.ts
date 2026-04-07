import type { AppId } from "@/core/domain/app/valueObject";
import { RecordId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { GetCommentsOutput, RecordCommentDto } from "./dto";

export type GetCommentsInput = {
  readonly appId: string;
  readonly recordId: string;
  readonly order?: "asc" | "desc";
  readonly offset?: number;
  readonly limit?: number;
};

export async function getComments({
  container,
  input,
}: ServiceArgs<GetCommentsInput>): Promise<GetCommentsOutput> {
  const appId = input.appId as AppId;
  const recordId = RecordId.create(input.recordId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const record = await ctx.recordRepository.findById(appId, recordId);
    if (!record) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Record ${input.recordId} not found`,
      );
    }

    const result = await ctx.recordCommentRepository.findByRecordId(
      appId,
      recordId,
      input.order,
      input.offset,
      input.limit,
    );

    const comments: RecordCommentDto[] = result.comments.map((c) => ({
      commentId: c.commentId,
      recordId: c.recordId,
      appId: c.appId,
      text: c.text,
      mentions: c.mentions,
      likes: [...c.likes] as string[],
      creatorId: c.creatorId,
      createdAt: c.createdAt,
    }));

    return {
      comments,
      older: result.older,
      newer: result.newer,
    };
  });
}
