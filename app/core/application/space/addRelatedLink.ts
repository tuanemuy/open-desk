import type { UserId } from "@/core/domain/identity/valueObject";
import { RelatedLink } from "@/core/domain/space/entity";
import type { SpaceId } from "@/core/domain/space/valueObject";
import type { ServiceArgs } from "../types";
import type { RelatedLinkDto } from "./dto";
import { assertSpaceAdmin, getSpaceOrThrow } from "./helpers";

export type AddRelatedLinkInput = {
  readonly operatorId: string;
  readonly spaceId: string;
  readonly title: string;
  readonly url: string;
};

export async function addRelatedLink({
  container,
  input,
}: ServiceArgs<AddRelatedLinkInput>): Promise<RelatedLinkDto> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await getSpaceOrThrow(ctx, spaceId);
    await assertSpaceAdmin(ctx, spaceId, operatorId);

    const { entity: link } = RelatedLink.create({
      spaceId,
      title: input.title,
      url: input.url,
    });
    await ctx.relatedLinkRepository.save(link);

    return {
      linkId: link.linkId,
      spaceId: link.spaceId,
      title: link.title,
      url: link.url,
    };
  });
}
