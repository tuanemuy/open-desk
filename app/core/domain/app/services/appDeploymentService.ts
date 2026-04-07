import type { AppId } from "../valueObject";

/**
 * Domain service for app deployment operations.
 *
 * Handles validation, deployment, and revert of app configurations
 * between preview and production environments.
 */

export type DeploymentValidationResult = {
  appId: AppId;
  isValid: boolean;
  errors: readonly string[];
};

export type DeployStatus = {
  appId: AppId;
  status: "PROCESSING" | "SUCCESS" | "FAIL" | "CANCEL";
};

export interface AppDeploymentService {
  /**
   * Validate that an app is ready for deployment.
   * Checks form consistency, layout integrity, etc.
   */
  validateForDeployment(appId: AppId): Promise<DeploymentValidationResult>;

  /**
   * Deploy a batch of apps from preview to production.
   */
  deployBatch(appIds: readonly AppId[]): Promise<void>;

  /**
   * Get the deployment status for a batch of apps.
   */
  getDeployStatus(appIds: readonly AppId[]): Promise<readonly DeployStatus[]>;

  /**
   * Revert preview environment changes and restore production settings.
   */
  revert(appId: AppId): Promise<void>;
}
