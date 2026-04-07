import { SystemPermissionId } from "@/core/domain/access-control/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import { assertSystemAdmin } from "./helpers";

export type DeleteSystemPermissionInput = {
  readonly operatorId: string;
  readonly systemPermissionId: string;
};

export async function deleteSystemPermission({
  container,
  input,
}: ServiceArgs<DeleteSystemPermissionInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const systemPermissionId = SystemPermissionId.create(
    input.systemPermissionId,
  );

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    assertSystemAdmin(operatorPermissions, userContext);

    const allPermissions = await ctx.systemPermissionRepository.findAll();
    const permission = allPermissions.find(
      (p) => p.systemPermissionId === systemPermissionId,
    );
    if (!permission) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `System permission ${input.systemPermissionId} not found`,
      );
    }

    await ctx.systemPermissionRepository.delete(systemPermissionId);
  });
}
