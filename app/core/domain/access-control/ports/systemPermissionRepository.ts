import type { SystemPermission } from "@/core/domain/access-control/entity";
import type {
  AclEntity as AclEntityType,
  SystemPermissionId as SystemPermissionIdType,
} from "@/core/domain/access-control/valueObject";

/**
 * Repository port for SystemPermission entity persistence.
 */
export interface SystemPermissionRepository {
  /**
   * Retrieve all system permissions.
   */
  findAll(): Promise<SystemPermission[]>;

  /**
   * Find a system permission by its entity (type + code).
   * @returns The SystemPermission, or null if not found.
   */
  findByEntity(entity: AclEntityType): Promise<SystemPermission | null>;

  /**
   * Find all system permissions applicable to a given user.
   * Includes permissions set on the user directly,
   * on organizations the user belongs to (considering includeSubs),
   * and on groups the user belongs to.
   */
  findByUser(
    userCode: string,
    organizationCodes: readonly string[],
    groupCodes: readonly string[],
  ): Promise<SystemPermission[]>;

  /**
   * Save a system permission (insert or update).
   * @returns The saved SystemPermission.
   */
  save(permission: SystemPermission): Promise<SystemPermission>;

  /**
   * Delete a system permission.
   */
  delete(systemPermissionId: SystemPermissionIdType): Promise<void>;
}
