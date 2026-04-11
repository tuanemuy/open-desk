import type { Organization } from "@/core/domain/identity/entity";
import type { OrganizationId as OrganizationIdType } from "@/core/domain/identity/valueObject";

/**
 * Repository port for Organization entity persistence.
 */
export interface OrganizationRepository {
  /**
   * Find an organization by its unique identifier.
   */
  findById(organizationId: OrganizationIdType): Promise<Organization | null>;

  /**
   * Find an organization by its code.
   */
  findByCode(code: string): Promise<Organization | null>;

  /**
   * Find child organizations of the specified parent.
   * Pass null to find root organizations.
   */
  findByParentId(
    parentOrganizationId: OrganizationIdType | null,
  ): Promise<Organization[]>;

  /**
   * Find all root organizations (those without a parent).
   */
  findRoot(): Promise<Organization[]>;

  /**
   * Save an organization (insert or update).
   */
  save(organization: Organization): Promise<void>;

  /**
   * Delete an organization by its unique identifier.
   */
  delete(organizationId: OrganizationIdType): Promise<void>;

  /**
   * Find all organizations.
   */
  findAll(): Promise<Organization[]>;
}
