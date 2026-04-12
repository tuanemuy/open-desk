import type { ProvisioningConfig } from "@/core/domain/identity/entity";

/**
 * Repository port for ProvisioningConfig entity persistence.
 * ProvisioningConfig is a singleton entity (one per tenant).
 */
export interface ProvisioningConfigRepository {
  /**
   * Get the provisioning configuration.
   */
  find(): Promise<ProvisioningConfig>;

  /**
   * Save the provisioning configuration.
   */
  save(config: ProvisioningConfig): Promise<void>;
}
