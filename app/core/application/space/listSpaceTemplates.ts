import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { SpaceTemplateListOutput } from "./dto";

export type ListSpaceTemplatesInput = {
  readonly operatorId: string;
  readonly offset?: number;
  readonly limit?: number;
};

export async function listSpaceTemplates({
  container,
  input,
}: ServiceArgs<ListSpaceTemplatesInput>): Promise<SpaceTemplateListOutput> {
  const operatorId = input.operatorId as UserId;
  const offset = input.offset ?? 0;
  const limit = input.limit ?? 100;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);
    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    const hasSpaceCreate =
      userContext.isCybozuAdmin ||
      operatorPermissions.some((p) => p.spaceCreate || p.systemAdmin);

    if (!hasSpaceCreate) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Space creation permission required",
      );
    }

    const { templates, totalCount } = await ctx.spaceTemplateRepository.list(
      offset,
      limit,
    );

    return {
      templates: templates.map((t) => ({
        templateId: t.templateId,
        name: t.name,
        sourceSpaceId: t.sourceSpaceId,
        useMultiThread: t.useMultiThread,
        createdAt: t.createdAt,
      })),
      totalCount,
    };
  });
}
