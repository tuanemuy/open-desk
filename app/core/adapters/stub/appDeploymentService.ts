import type {
  AppDeploymentService,
  DeploymentValidationResult,
  DeployStatus,
} from "@/core/domain/app/services/appDeploymentService";
import type { AppId } from "@/core/domain/app/valueObject";

export class StubAppDeploymentService implements AppDeploymentService {
  validateForDeployment(_appId: AppId): Promise<DeploymentValidationResult> {
    throw new Error("Not implemented");
  }

  deployBatch(_appIds: readonly AppId[]): Promise<void> {
    throw new Error("Not implemented");
  }

  getDeployStatus(_appIds: readonly AppId[]): Promise<readonly DeployStatus[]> {
    throw new Error("Not implemented");
  }

  revert(_appId: AppId): Promise<void> {
    throw new Error("Not implemented");
  }
}
