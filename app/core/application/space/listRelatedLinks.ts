import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import type { ServiceArgs } from "../types";
import type { RelatedLinkDto } from "./dto";
import { assertSpaceAccessible, getSpaceOrThrow } from "./helpers";

export type ListRelatedLinksInput = {
  readonly operatorId: string;
  readonly spaceId: string;
};

export async function listRelatedLinks({
  container,
  input,
}: ServiceArgs<ListRelatedLinksInput>): Promise<{ links: RelatedLinkDto[] }> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const space = await getSpaceOrThrow(ctx, spaceId);
    await assertSpaceAccessible(ctx, spaceId, operatorId, space.isPrivate);

    const links = await ctx.relatedLinkRepository.findBySpaceId(spaceId);
    return {
      links: links.map((l) => ({
        linkId: l.linkId,
        spaceId: l.spaceId,
        title: l.title,
        url: l.url,
      })),
    };
  });
}
