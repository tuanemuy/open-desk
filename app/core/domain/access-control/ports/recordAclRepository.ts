import type { RecordAcl } from "@/core/domain/access-control/entity";
import type { AppId as AppIdType } from "@/core/domain/app/valueObject";

/**
 * Repository port for RecordAcl entity persistence.
 */
export interface RecordAclRepository {
  /**
   * Find the record ACL by app ID.
   * @returns The RecordAcl. If not set, returns a default (empty rights).
   */
  findByAppId(appId: AppIdType): Promise<RecordAcl>;

  /**
   * Save the record ACL (insert or update).
   * Increments the revision on save.
   * @returns The saved RecordAcl with the confirmed revision.
   */
  save(recordAcl: RecordAcl): Promise<RecordAcl>;
}
