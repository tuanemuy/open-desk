import type {
  AppDeploymentService,
  DeploymentValidationResult,
  DeployStatus,
} from "@/core/domain/app/services/appDeploymentService";
import type { AppId } from "@/core/domain/app/valueObject";
import { StubNotImplementedError } from "./error";

export class StubAppDeploymentService implements AppDeploymentService {
  validateForDeployment(_appId: AppId): Promise<DeploymentValidationResult> {
    throw new StubNotImplementedError("AppDeploymentService");
  }

  deployBatch(_appIds: readonly AppId[]): Promise<void> {
    throw new StubNotImplementedError("AppDeploymentService");
  }

  getDeployStatus(_appIds: readonly AppId[]): Promise<readonly DeployStatus[]> {
    throw new StubNotImplementedError("AppDeploymentService");
  }

  revert(_appId: AppId): Promise<void> {
    throw new StubNotImplementedError("AppDeploymentService");
  }
}
