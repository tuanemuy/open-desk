import { App } from "@/core/domain/app/entity";
import { AppId } from "@/core/domain/app/valueObject";
import { UserId } from "@/core/domain/identity/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { DeployAppsOutput, DeployResultItem } from "./dto";

const MAX_DEPLOY_BATCH_SIZE = 300;

export type DeployAppsInput = {
  appIds: string[];
  executorId: string;
};

export async function deployApps({
  container,
  input,
}: ServiceArgs<DeployAppsInput>): Promise<DeployAppsOutput> {
  const _executorId = UserId.create(input.executorId);

  if (input.appIds.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "At least one app ID is required",
    );
  }
  if (input.appIds.length > MAX_DEPLOY_BATCH_SIZE) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `Cannot deploy more than ${MAX_DEPLOY_BATCH_SIZE} apps at once`,
    );
  }

  const appIds = input.appIds.map((id) => AppId.create(id));

  // Validate all apps for deployment
  const validAppIds: (typeof appIds)[number][] = [];
  const results: DeployResultItem[] = [];

  for (const appId of appIds) {
    const validation =
      await container.appDeploymentService.validateForDeployment(appId);
    if (validation.isValid) {
      validAppIds.push(appId);
    } else {
      results.push({ appId, status: "FAIL" });
    }
  }

  if (validAppIds.length > 0) {
    await container.appDeploymentService.deployBatch(validAppIds);
  }

  // Update app statuses within a transaction
  await container.unitOfWorkProvider.transaction(async (repos) => {
    for (const appId of validAppIds) {
      const app = await repos.appRepository.findById(appId);
      if (app === null) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `App ${appId} not found`,
        );
      }
      const { entity: deployedApp } = App.deploy(app);
      await repos.appRepository.save(deployedApp);
    }
  });

  // Get deploy statuses
  const deployStatuses =
    await container.appDeploymentService.getDeployStatus(appIds);

  for (const status of deployStatuses) {
    const existing = results.find((r) => r.appId === status.appId);
    if (!existing) {
      results.push({ appId: status.appId, status: status.status });
    }
  }

  return { results };
}
