import { AppErrorCode } from "@/core/domain/app/errorCode";
import { PluginId } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { assertSystemAdmin } from "../access-control/helpers";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type DeletePluginInput = {
  readonly operatorId: string;
  readonly pluginId: string;
};

export async function deletePlugin({
  container,
  input,
}: ServiceArgs<DeletePluginInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const pluginId = PluginId.create(input.pluginId);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const permissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    assertSystemAdmin(permissions, userContext);

    const plugin = await ctx.pluginRepository.findById(pluginId);
    if (!plugin) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Plugin ${input.pluginId} not found`,
      );
    }

    if (plugin.isPreinstalled) {
      throw new BusinessRuleError(
        AppErrorCode.PreinstalledPluginModification,
        "Preinstalled plugin cannot be deleted",
      );
    }

    await ctx.pluginRepository.delete(pluginId);
  });
}
