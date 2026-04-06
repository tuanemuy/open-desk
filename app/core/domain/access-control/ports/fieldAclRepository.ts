import type { FieldAcl } from "@/core/domain/access-control/entity";
import type { AppId as AppIdType } from "@/core/domain/app/valueObject";

/**
 * Repository port for FieldAcl entity persistence.
 */
export interface FieldAclRepository {
  /**
   * Find the field ACL by app ID.
   * @returns The FieldAcl. If not set, returns a default (empty rights).
   */
  findByAppId(appId: AppIdType): Promise<FieldAcl>;

  /**
   * Save the field ACL (insert or update).
   * Increments the revision on save.
   * @returns The saved FieldAcl with the confirmed revision.
   */
  save(fieldAcl: FieldAcl): Promise<FieldAcl>;
}
