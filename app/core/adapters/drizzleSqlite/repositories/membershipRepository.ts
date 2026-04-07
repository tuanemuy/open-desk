import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import {
  userGroups,
  userOrganizations,
} from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { MembershipRepository } from "@/core/domain/identity/ports/membershipRepository";
import type {
  GroupId as GroupIdType,
  OrganizationId as OrganizationIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

export class DrizzleSqliteMembershipRepository implements MembershipRepository {
  constructor(private readonly executor: Executor) {}

  async addUserToOrganization(params: {
    userId: UserIdType;
    organizationId: OrganizationIdType;
  }): Promise<void> {
    try {
      await this.executor
        .insert(userOrganizations)
        .values({
          id: uuidv7(),
          userId: params.userId,
          organizationId: params.organizationId,
        })
        .onConflictDoNothing();
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to add user to organization",
        error,
      );
    }
  }

  async removeUserFromOrganization(params: {
    userId: UserIdType;
    organizationId: OrganizationIdType;
  }): Promise<void> {
    try {
      await this.executor
        .delete(userOrganizations)
        .where(
          and(
            eq(userOrganizations.userId, params.userId),
            eq(userOrganizations.organizationId, params.organizationId),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to remove user from organization",
        error,
      );
    }
  }

  async addUserToGroup(params: {
    userId: UserIdType;
    groupId: GroupIdType;
  }): Promise<void> {
    try {
      await this.executor
        .insert(userGroups)
        .values({
          id: uuidv7(),
          userId: params.userId,
          groupId: params.groupId,
        })
        .onConflictDoNothing();
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to add user to group",
        error,
      );
    }
  }

  async removeUserFromGroup(params: {
    userId: UserIdType;
    groupId: GroupIdType;
  }): Promise<void> {
    try {
      await this.executor
        .delete(userGroups)
        .where(
          and(
            eq(userGroups.userId, params.userId),
            eq(userGroups.groupId, params.groupId),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to remove user from group",
        error,
      );
    }
  }

  async getOrganizationIdsByUserId(
    userId: UserIdType,
  ): Promise<OrganizationIdType[]> {
    try {
      const results = await this.executor
        .select({ organizationId: userOrganizations.organizationId })
        .from(userOrganizations)
        .where(eq(userOrganizations.userId, userId));

      return results.map((r) => r.organizationId as OrganizationIdType);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to get organization ids by user id",
        error,
      );
    }
  }

  async getGroupIdsByUserId(userId: UserIdType): Promise<GroupIdType[]> {
    try {
      const results = await this.executor
        .select({ groupId: userGroups.groupId })
        .from(userGroups)
        .where(eq(userGroups.userId, userId));

      return results.map((r) => r.groupId as GroupIdType);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to get group ids by user id",
        error,
      );
    }
  }
}
