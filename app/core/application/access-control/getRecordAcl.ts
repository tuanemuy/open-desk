import { evaluateAppPermission } from "@/core/domain/access-control/services/aclEvaluationService";
import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { RecordAclOutput } from "./dto";

export type GetRecordAclInput = {
  readonly operatorId: string;
  readonly appId: string;
  readonly lang?: string;
};

export async function getRecordAcl({
  container,
  input,
}: ServiceArgs<GetRecordAclInput>): Promise<RecordAclOutput> {
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

    return {
      appId: recordAcl.appId as string,
      rights: recordAcl.rights,
      revision: recordAcl.revision,
    };
  });
}
