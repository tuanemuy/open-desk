import { Plugin } from "@/core/domain/app/entity";
import { PluginId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { assertSystemAdmin } from "../access-control/helpers";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { PluginDto } from "./dto";

export type UpdatePluginStatusInput = {
  readonly operatorId: string;
  readonly pluginId: string;
  readonly isActive: boolean;
};

export async function updatePluginStatus({
  container,
  input,
}: ServiceArgs<UpdatePluginStatusInput>): Promise<PluginDto> {
  const operatorId = input.operatorId as UserId;
  const pluginId = PluginId.create(input.pluginId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const permissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    assertSystemAdmin(permissions, userContext);

    let plugin = await ctx.pluginRepository.findById(pluginId);
    if (!plugin) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Plugin ${input.pluginId} not found`,
      );
    }

    if (input.isActive) {
      plugin = Plugin.activate(plugin);
    } else {
      plugin = Plugin.deactivate(plugin);
    }

    await ctx.pluginRepository.save(plugin);

    return {
      pluginId: plugin.pluginId,
      name: plugin.name,
      description: plugin.description,
      isActive: plugin.isActive,
      isPreinstalled: plugin.isPreinstalled,
      installedAppIds: plugin.installedAppIds,
      createdAt: plugin.createdAt,
      updatedAt: plugin.updatedAt,
    };
  });
}
