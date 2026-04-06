import type { Group } from "@/core/domain/identity/entity";
import type { GroupId as GroupIdType } from "@/core/domain/identity/valueObject";

/**
 * Parameters for listing groups with pagination.
 */
export type GroupListParams = {
  readonly offset: number;
  readonly limit: number;
  readonly keyword?: string;
};

/**
 * Paginated group listing result.
 */
export type GroupListResult = {
  readonly groups: readonly Group[];
  readonly totalCount: number;
};

/**
 * Repository port for Group entity persistence.
 */
export interface GroupRepository {
  /**
   * Find a group by its unique identifier.
   */
  findById(groupId: GroupIdType): Promise<Group | null>;

  /**
   * Find a group by its code.
   */
  findByCode(code: string): Promise<Group | null>;

  /**
   * Save a group (insert or update).
   */
  save(group: Group): Promise<void>;

  /**
   * Delete a group by its unique identifier.
   */
  delete(groupId: GroupIdType): Promise<void>;

  /**
   * List groups with pagination and optional keyword search.
   */
  list(params: GroupListParams): Promise<GroupListResult>;
}
