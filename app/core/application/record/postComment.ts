import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { RecordComment } from "@/core/domain/record/entity";
import type { Mention } from "@/core/domain/record/valueObject";
import { RecordId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { PostCommentOutput } from "./dto";

export type PostCommentInput = {
  readonly appId: string;
  readonly recordId: string;
  readonly text: string;
  readonly mentions?: readonly Mention[];
  readonly creatorId: string;
};

export async function postComment({
  container,
  input,
}: ServiceArgs<PostCommentInput>): Promise<PostCommentOutput> {
  const appId = input.appId as AppId;
  const recordId = RecordId.create(input.recordId);
  const creatorId = input.creatorId as UserId;
  const mentions = input.mentions ?? [];

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const record = await ctx.recordRepository.findById(appId, recordId);
    if (!record) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Record ${input.recordId} not found`,
      );
    }

    const { entity: comment } = RecordComment.create({
      recordId,
      appId,
      text: input.text,
      mentions,
      creatorId,
    });

    await ctx.recordCommentRepository.save(comment);

    return { commentId: comment.commentId };
  });
}
