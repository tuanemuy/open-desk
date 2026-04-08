import type { AuditLogSetting } from "@/core/domain/audit/entity";

/**
 * Repository port for AuditLogSetting entity persistence.
 * AuditLogSetting is a singleton entity (one per tenant).
 */
export interface AuditLogSettingRepository {
  /**
   * Find the current audit log setting.
   * @returns The audit log setting.
   */
  find(): Promise<AuditLogSetting>;

  /**
   * Save the audit log setting.
   */
  save(setting: AuditLogSetting): Promise<void>;
}
