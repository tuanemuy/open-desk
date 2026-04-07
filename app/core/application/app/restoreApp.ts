import { App } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import { AppId } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { RestoreAppOutput } from "./dto";

const MAX_APP_COUNT = 1000;

export type RestoreAppInput = {
  appId: string;
  executorId: string;
};

export async function restoreApp({
  container,
  input,
}: ServiceArgs<RestoreAppInput>): Promise<RestoreAppOutput> {
  const appId = AppId.create(input.appId);
  const _executorId = UserId.create(input.executorId);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const existingApp = await repos.appRepository.findById(appId);
    if (existingApp === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.appId} not found`,
      );
    }

    const appCount = await repos.appRepository.countAll();
    if (appCount >= MAX_APP_COUNT) {
      throw new BusinessRuleError(
        AppErrorCode.DeletedAppModification,
        `Cannot restore: app count has reached the maximum of ${MAX_APP_COUNT}`,
      );
    }

    const { entity: app } = App.restore(existingApp);

    await repos.appRepository.save(app);

    return {
      appId: app.appId,
      status: "ACTIVE" as const,
      restoredAt: app.updatedAt,
    };
  });
}
