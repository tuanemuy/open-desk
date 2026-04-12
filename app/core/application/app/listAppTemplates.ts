import { SystemPermission } from "@/core/domain/access-control/entity";
import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { AppTemplateListOutput } from "./dto";

export type ListAppTemplatesInput = {
  readonly operatorId: string;
  readonly offset?: number;
  readonly limit?: number;
};

export async function listAppTemplates({
  container,
  input,
}: ServiceArgs<ListAppTemplatesInput>): Promise<AppTemplateListOutput> {
  const operatorId = input.operatorId as UserId;
  const offset = input.offset ?? 0;
  const limit = input.limit ?? 100;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const permissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    const hasAppCreate =
      userContext.isCybozuAdmin ||
      permissions.some((p) => SystemPermission.hasRight(p, "APP_CREATE"));

    if (!hasAppCreate) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "App create permission required",
      );
    }

    const { templates, totalCount } = await ctx.appTemplateRepository.list(
      offset,
      limit,
    );

    return {
      templates: templates.map((t) => ({
        templateId: t.templateId,
        name: t.name,
        description: t.description,
        sourceAppId: t.sourceAppId,
        creatorId: t.creatorId,
        createdAt: t.createdAt,
      })),
      totalCount,
    };
  });
}
