import { SpaceId as AppSpaceId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { SpaceTemplate } from "@/core/domain/space/entity";
import type { SpaceId } from "@/core/domain/space/valueObject";
import type { ServiceArgs } from "../types";
import type { CreateSpaceTemplateOutput } from "./dto";
import { assertSpaceAdmin, getSpaceOrThrow } from "./helpers";

export type CreateSpaceTemplateInput = {
  readonly operatorId: string;
  readonly spaceId: string;
  readonly name: string;
};

export async function createSpaceTemplate({
  container,
  input,
}: ServiceArgs<CreateSpaceTemplateInput>): Promise<CreateSpaceTemplateOutput> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const space = await getSpaceOrThrow(ctx, spaceId);
    await assertSpaceAdmin(ctx, spaceId, operatorId);

    const [threads, relatedLinks, announcement, apps] = await Promise.all([
      ctx.threadRepository.findBySpaceId(spaceId),
      ctx.relatedLinkRepository.findBySpaceId(spaceId),
      ctx.spaceAnnouncementRepository.findBySpaceId(spaceId),
      ctx.appRepository.findBySpaceId(
        AppSpaceId.create(spaceId as string),
        0,
        10000,
      ),
    ]);

    const threadNames = threads.map((t) => t.title);
    const appIds = apps.map((a) => a.appId);

    const { entity: template } = SpaceTemplate.create({
      name: input.name,
      sourceSpaceId: spaceId,
      useMultiThread: space.useMultiThread,
      fixedMember: space.fixedMember,
      appCreationPermission: space.appCreationPermission,
      coverImage: space.coverImage,
      portalDisplay: space.portalDisplay,
      threadNames,
      appIds,
      relatedLinks,
      announcementBody: announcement?.body,
    });

    await ctx.spaceTemplateRepository.save(template);

    return {
      templateId: template.templateId,
      name: template.name,
      sourceSpaceId: template.sourceSpaceId,
      useMultiThread: template.useMultiThread,
      fixedMember: template.fixedMember,
      appCreationPermission: template.appCreationPermission,
      coverImage: template.coverImage,
      portalDisplay: template.portalDisplay,
      threadNames: template.threadNames,
      appIds: template.appIds,
      relatedLinks: template.relatedLinks.map((l) => ({
        linkId: l.linkId,
        spaceId: l.spaceId,
        title: l.title,
        url: l.url,
      })),
      announcementBody: announcement?.body ?? undefined,
      createdAt: template.createdAt,
    };
  });
}
