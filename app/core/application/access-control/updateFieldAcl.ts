import {
  FieldAcl,
  type FieldAclRule,
} from "@/core/domain/access-control/entity";
import { evaluateAppPermission } from "@/core/domain/access-control/services/aclEvaluationService";
import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { FieldAclOutput } from "./dto";

export type UpdateFieldAclInput = {
  readonly operatorId: string;
  readonly appId: string;
  readonly rights: readonly FieldAclRule[];
  readonly revision?: number;
};

export async function updateFieldAcl({
  container,
  input,
}: ServiceArgs<UpdateFieldAclInput>): Promise<FieldAclOutput> {
  const appId = input.appId as AppId;
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);
    const appAcl = await ctx.appAclRepository.findByAppId(appId);

    const appPermission = evaluateAppPermission(appAcl, userContext, false);
    if (!appPermission.appEditable) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "App management permission required",
      );
    }

    const fieldAcl = await ctx.fieldAclRepository.findByAppId(appId);
    FieldAcl.checkRevision(fieldAcl, input.revision);

    const { entity: updatedAcl } = FieldAcl.updateRights(
      fieldAcl,
      input.rights,
    );
    const savedAcl = await ctx.fieldAclRepository.save(updatedAcl);

    return {
      appId: savedAcl.appId as string,
      rights: savedAcl.rights,
      revision: savedAcl.revision,
    };
  });
}
