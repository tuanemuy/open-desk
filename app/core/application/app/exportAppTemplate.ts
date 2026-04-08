import { SystemPermission } from "@/core/domain/access-control/entity";
import { AppTemplateId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { ExportAppTemplateOutput } from "./dto";

export type ExportAppTemplateInput = {
  readonly operatorId: string;
  readonly templateId: string;
};

export async function exportAppTemplate({
  container,
  input,
}: ServiceArgs<ExportAppTemplateInput>): Promise<ExportAppTemplateOutput> {
  const operatorId = input.operatorId as UserId;
  const templateId = AppTemplateId.create(input.templateId);

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

    const template = await ctx.appTemplateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App template ${input.templateId} not found`,
      );
    }

    const file = await ctx.appTemplateRepository.exportToFile(templateId);

    return {
      file,
      fileName: `${template.name}.template`,
    };
  });
}
