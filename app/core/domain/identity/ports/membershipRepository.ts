import type {
  GroupId as GroupIdType,
  OrganizationId as OrganizationIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";

/**
 * Repository port for managing user-organization and user-group memberships.
 */
export interface MembershipRepository {
  /**
   * Add a user to an organization.
   */
  addUserToOrganization(params: {
    userId: UserIdType;
    organizationId: OrganizationIdType;
  }): Promise<void>;

  /**
   * Remove a user from an organization.
   */
  removeUserFromOrganization(params: {
    userId: UserIdType;
    organizationId: OrganizationIdType;
  }): Promise<void>;

  /**
   * Add a user to a group.
   */
  addUserToGroup(params: {
    userId: UserIdType;
    groupId: GroupIdType;
  }): Promise<void>;

  /**
   * Remove a user from a group.
   */
  removeUserFromGroup(params: {
    userId: UserIdType;
    groupId: GroupIdType;
  }): Promise<void>;

  /**
   * Get all organization IDs that a user belongs to.
   */
  getOrganizationIdsByUserId(userId: UserIdType): Promise<OrganizationIdType[]>;

  /**
   * Get all group IDs that a user belongs to.
   */
  getGroupIdsByUserId(userId: UserIdType): Promise<GroupIdType[]>;
}
