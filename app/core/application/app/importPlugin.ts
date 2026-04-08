import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { assertSystemAdmin } from "../access-control/helpers";
import type { ServiceArgs } from "../types";
import type { PluginDto } from "./dto";

export type ImportPluginInput = {
  readonly operatorId: string;
  readonly file: ArrayBuffer;
};

export async function importPlugin({
  container,
  input,
}: ServiceArgs<ImportPluginInput>): Promise<PluginDto> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const permissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    assertSystemAdmin(permissions, userContext);

    const plugin = await ctx.pluginRepository.importFromFile(input.file);

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
