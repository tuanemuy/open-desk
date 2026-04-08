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

export type DeleteAppTemplateInput = {
  readonly operatorId: string;
  readonly templateId: string;
};

export async function deleteAppTemplate({
  container,
  input,
}: ServiceArgs<DeleteAppTemplateInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const templateId = AppTemplateId.create(input.templateId);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const permissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    const hasAppManage =
      userContext.isCybozuAdmin ||
      permissions.some((p) => SystemPermission.hasRight(p, "APP_MANAGE"));

    if (!hasAppManage) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "App manage permission required",
      );
    }

    const template = await ctx.appTemplateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App template ${input.templateId} not found`,
      );
    }

    await ctx.appTemplateRepository.delete(templateId);
  });
}
