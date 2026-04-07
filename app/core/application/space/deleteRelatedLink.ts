import type { UserId } from "@/core/domain/identity/valueObject";
import type { RelatedLinkId } from "@/core/domain/space/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { assertSpaceAdmin } from "./helpers";

export type DeleteRelatedLinkInput = {
  readonly operatorId: string;
  readonly linkId: string;
};

export async function deleteRelatedLink({
  container,
  input,
}: ServiceArgs<DeleteRelatedLinkInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const linkId = input.linkId as RelatedLinkId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const link = await ctx.relatedLinkRepository.findById(linkId);
    if (!link) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Related link ${input.linkId} not found`,
      );
    }
    await assertSpaceAdmin(ctx, link.spaceId, operatorId);
    await ctx.relatedLinkRepository.delete(linkId);
  });
}
