import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { assertSystemAdmin } from "../access-control/helpers";
import type { ServiceArgs } from "../types";
import type { PluginListOutput } from "./dto";

export type ListPluginsInput = {
  readonly operatorId: string;
  readonly offset?: number;
  readonly limit?: number;
};

export async function listPlugins({
  container,
  input,
}: ServiceArgs<ListPluginsInput>): Promise<PluginListOutput> {
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

    assertSystemAdmin(permissions, userContext);

    const { plugins, totalCount } = await ctx.pluginRepository.list(
      offset,
      limit,
    );

    return {
      plugins: plugins.map((p) => ({
        pluginId: p.pluginId,
        name: p.name,
        description: p.description,
        isActive: p.isActive,
        isPreinstalled: p.isPreinstalled,
        installedAppIds: p.installedAppIds,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      totalCount,
    };
  });
}
