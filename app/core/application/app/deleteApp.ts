import { App } from "@/core/domain/app/entity";
import { AppId } from "@/core/domain/app/valueObject";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { DeleteAppOutput } from "./dto";

export type DeleteAppInput = {
  appId: string;
  executorId: string;
};

export async function deleteApp({
  container,
  input,
}: ServiceArgs<DeleteAppInput>): Promise<DeleteAppOutput> {
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

    const { entity: app } = App.markAsDeleted(existingApp);

    await repos.appRepository.save(app);

    return {
      appId: app.appId,
      status: "DELETED" as const,
      deletedAt: app.updatedAt,
    };
  });
}
