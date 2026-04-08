import type { ScimExternalMapping } from "@/core/domain/identity/entity";
import type {
  ExternalId as ExternalIdType,
  ScimResourceType as ScimResourceTypeType,
} from "@/core/domain/identity/valueObject";

/**
 * Repository port for ScimExternalMapping entity persistence.
 */
export interface ScimExternalMappingRepository {
  /**
   * Find a mapping by external ID and resource type.
   */
  findByExternalId(params: {
    externalId: ExternalIdType;
    resourceType: ScimResourceTypeType;
  }): Promise<ScimExternalMapping | null>;

  /**
   * Find a mapping by internal ID and resource type.
   */
  findByInternalId(params: {
    internalId: string;
    resourceType: ScimResourceTypeType;
  }): Promise<ScimExternalMapping | null>;

  /**
   * Save a mapping (insert or update).
   */
  save(mapping: ScimExternalMapping): Promise<void>;

  /**
   * Delete a mapping by external ID and resource type.
   */
  delete(params: {
    externalId: ExternalIdType;
    resourceType: ScimResourceTypeType;
  }): Promise<void>;
}
