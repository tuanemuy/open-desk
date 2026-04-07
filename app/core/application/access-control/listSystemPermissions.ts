import type { UserId } from "@/core/domain/identity/valueObject";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { SystemPermissionListOutput } from "./dto";
import { assertSystemAdmin, toSystemPermissionDto } from "./helpers";

export type ListSystemPermissionsInput = {
  readonly operatorId: string;
};

export async function listSystemPermissions({
  container,
  input,
}: ServiceArgs<ListSystemPermissionsInput>): Promise<SystemPermissionListOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    assertSystemAdmin(operatorPermissions, userContext);

    const allPermissions = await ctx.systemPermissionRepository.findAll();

    return {
      permissions: allPermissions.map(toSystemPermissionDto),
    };
  });
}
