import { View } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import { AppId, AppStatus, ViewId } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { DeleteViewOutput } from "./dto";

export type DeleteViewInput = {
  appId: string;
  viewId: string;
  executorId: string;
};

export async function deleteView({
  container,
  input,
}: ServiceArgs<DeleteViewInput>): Promise<DeleteViewOutput> {
  const appId = AppId.create(input.appId);
  const viewId = ViewId.create(input.viewId);
  const _executorId = UserId.create(input.executorId);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const app = await repos.appRepository.findById(appId);
    if (app === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.appId} not found`,
      );
    }
    if (AppStatus.isDeleted(app.status)) {
      throw new BusinessRuleError(
        AppErrorCode.DeletedAppModification,
        "Cannot modify a deleted app",
      );
    }

    const view = await repos.viewRepository.findById(viewId);
    if (view === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `View ${input.viewId} not found`,
      );
    }

    if (View.isBuiltin(view)) {
      throw new BusinessRuleError(
        AppErrorCode.BuiltinViewModification,
        "Cannot delete a builtin view",
      );
    }

    await repos.viewRepository.delete(viewId);

    return {
      viewId: view.viewId,
    };
  });
}
