import {
  RecordAcl,
  type RecordAclRule,
} from "@/core/domain/access-control/entity";
import { evaluateAppPermission } from "@/core/domain/access-control/services/aclEvaluationService";
import { validateFilterCond } from "@/core/domain/access-control/services/filterCondValidator";
import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { RecordAclOutput } from "./dto";

export type UpdateRecordAclInput = {
  readonly operatorId: string;
  readonly appId: string;
  readonly rights: readonly RecordAclRule[];
  readonly revision?: number;
};

export async function updateRecordAcl({
  container,
  input,
}: ServiceArgs<UpdateRecordAclInput>): Promise<RecordAclOutput> {
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

    const recordAcl = await ctx.recordAclRepository.findByAppId(appId);
    RecordAcl.checkRevision(recordAcl, input.revision);

    for (const rule of input.rights) {
      if (rule.filterCond !== null) {
        validateFilterCond(rule.filterCond);
      }
    }

    const { entity: updatedAcl } = RecordAcl.updateRights(
      recordAcl,
      input.rights,
    );
    const savedAcl = await ctx.recordAclRepository.save(updatedAcl);

    return {
      appId: savedAcl.appId as string,
      rights: savedAcl.rights,
      revision: savedAcl.revision,
    };
  });
}
