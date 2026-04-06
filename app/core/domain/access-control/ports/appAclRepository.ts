import type { AppAcl } from "@/core/domain/access-control/entity";
import type { AppId as AppIdType } from "@/core/domain/app/valueObject";

/**
 * Repository port for AppAcl entity persistence.
 */
export interface AppAclRepository {
  /**
   * Find the app ACL by app ID.
   * @returns The AppAcl. If not set, returns a default (Everyone with all permissions granted).
   */
  findByAppId(appId: AppIdType): Promise<AppAcl>;

  /**
   * Save the app ACL (insert or update).
   * Increments the revision on save.
   * @returns The saved AppAcl with the confirmed revision.
   */
  save(appAcl: AppAcl): Promise<AppAcl>;
}
