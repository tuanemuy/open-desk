import { SystemPermission } from "@/core/domain/access-control/entity";
import { AppTemplateName } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { AppTemplateDto } from "./dto";

export type ImportAppTemplateInput = {
  readonly operatorId: string;
  readonly file: ArrayBuffer;
  readonly name: string;
};

export async function importAppTemplate({
  container,
  input,
}: ServiceArgs<ImportAppTemplateInput>): Promise<AppTemplateDto> {
  const operatorId = input.operatorId as UserId;

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

    const templateName = AppTemplateName.create(input.name);

    const template = await ctx.appTemplateRepository.importFromFile(
      input.file,
      templateName,
      operatorId,
    );

    return {
      templateId: template.templateId,
      name: template.name,
      description: template.description,
      sourceAppId: template.sourceAppId,
      creatorId: template.creatorId,
      createdAt: template.createdAt,
    };
  });
}
