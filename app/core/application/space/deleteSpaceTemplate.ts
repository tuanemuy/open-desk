import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceTemplateId } from "@/core/domain/space/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { assertSystemAdmin } from "../access-control/helpers";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type DeleteSpaceTemplateInput = {
  readonly operatorId: string;
  readonly templateId: string;
};

export async function deleteSpaceTemplate({
  container,
  input,
}: ServiceArgs<DeleteSpaceTemplateInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const templateId = input.templateId as SpaceTemplateId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);
    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );
    assertSystemAdmin(operatorPermissions, userContext);

    const template = await ctx.spaceTemplateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Space template ${templateId} not found`,
      );
    }

    await ctx.spaceTemplateRepository.delete(templateId);
  });
}
