import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq, like, or } from "drizzle-orm";
import {
  userGroups,
  userOrganizations,
  users,
} from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { User } from "@/core/domain/identity/entity";
import type {
  GuestUserListParams,
  GuestUserListResult,
  UserListParams,
  UserListResult,
  UserRepository,
} from "@/core/domain/identity/ports/userRepository";
import type {
  Email as EmailType,
  GroupId as GroupIdType,
  HashedPassword as HashedPasswordType,
  LoginName as LoginNameType,
  OrganizationId as OrganizationIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type UserDataModel = InferSelectModel<typeof users>;

export class DrizzleSqliteUserRepository implements UserRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: UserDataModel): User {
    return {
      userId: data.id as UserIdType,
      loginName: data.loginName as LoginNameType,
      displayName:
        data.displayName as import("@/core/domain/identity/valueObject").DisplayName,
      email: data.email as EmailType,
      primaryOrganizationId:
        data.primaryOrganizationId !== null
          ? (data.primaryOrganizationId as OrganizationIdType)
          : null,
      timezone:
        data.timezone as import("@/core/domain/identity/valueObject").Timezone,
      language:
        data.language as import("@/core/domain/identity/valueObject").Language,
      timeFormat:
        data.timeFormat as import("@/core/domain/identity/valueObject").TimeFormat,
      isActive: data.isActive,
      avatarFileKey:
        data.avatarFileKey !== null
          ? (data.avatarFileKey as import("@/core/domain/identity/valueObject").FileKey)
          : null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async findById(userId: UserIdType): Promise<User | null> {
    try {
      const results = await this.executor
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find user by id",
        error,
      );
    }
  }

  async findByEmail(email: EmailType): Promise<User | null> {
    try {
      const results = await this.executor
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find user by email",
        error,
      );
    }
  }

  async findByLoginName(loginName: LoginNameType): Promise<User | null> {
    try {
      const results = await this.executor
        .select()
        .from(users)
        .where(eq(users.loginName, loginName))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find user by login name",
        error,
      );
    }
  }

  async findCredentialsByLoginName(loginName: LoginNameType): Promise<{
    userId: UserIdType;
    hashedPassword: HashedPasswordType;
    isActive: boolean;
  } | null> {
    try {
      const results = await this.executor
        .select({
          id: users.id,
          passwordHash: users.passwordHash,
          passwordAlgorithm: users.passwordAlgorithm,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.loginName, loginName))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const row = results[0];
      return {
        userId: row.id as UserIdType,
        hashedPassword: {
          value: row.passwordHash,
          algorithm: row.passwordAlgorithm,
        } as HashedPasswordType,
        isActive: row.isActive,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find credentials by login name",
        error,
      );
    }
  }

  async findByOrganizationId(
    organizationId: OrganizationIdType,
  ): Promise<User[]> {
    try {
      const results = await this.executor
        .select({ user: users })
        .from(users)
        .innerJoin(userOrganizations, eq(users.id, userOrganizations.userId))
        .where(eq(userOrganizations.organizationId, organizationId));

      return results.map((r) => this.into(r.user));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find users by organization id",
        error,
      );
    }
  }

  async findByGroupId(groupId: GroupIdType): Promise<User[]> {
    try {
      const results = await this.executor
        .select({ user: users })
        .from(users)
        .innerJoin(userGroups, eq(users.id, userGroups.userId))
        .where(eq(userGroups.groupId, groupId));

      return results.map((r) => this.into(r.user));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find users by group id",
        error,
      );
    }
  }

  async save(user: User): Promise<void> {
    try {
      await this.executor
        .insert(users)
        .values({
          id: user.userId,
          loginName: user.loginName,
          displayName: user.displayName,
          email: user.email,
          passwordHash: "",
          passwordAlgorithm: "bcrypt",
          primaryOrganizationId: user.primaryOrganizationId,
          timezone: user.timezone,
          language: user.language,
          timeFormat: user.timeFormat,
          isActive: user.isActive,
          avatarFileKey: user.avatarFileKey,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            loginName: user.loginName,
            displayName: user.displayName,
            email: user.email,
            primaryOrganizationId: user.primaryOrganizationId,
            timezone: user.timezone,
            language: user.language,
            timeFormat: user.timeFormat,
            isActive: user.isActive,
            avatarFileKey: user.avatarFileKey,
            updatedAt: user.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save user",
        error,
      );
    }
  }

  async savePassword(
    userId: UserIdType,
    hashedPassword: HashedPasswordType,
  ): Promise<void> {
    try {
      await this.executor
        .update(users)
        .set({
          passwordHash: hashedPassword.value,
          passwordAlgorithm: hashedPassword.algorithm,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save password",
        error,
      );
    }
  }

  async delete(userId: UserIdType): Promise<void> {
    try {
      await this.executor.delete(users).where(eq(users.id, userId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete user",
        error,
      );
    }
  }

  async list(params: UserListParams): Promise<UserListResult> {
    try {
      const conditions = [];

      if (params.filter?.isActive !== undefined) {
        conditions.push(eq(users.isActive, params.filter.isActive));
      }

      if (
        params.filter?.keyword !== undefined &&
        params.filter.keyword !== ""
      ) {
        const keyword = `%${params.filter.keyword}%`;
        conditions.push(
          or(
            like(users.displayName, keyword),
            like(users.loginName, keyword),
            like(users.email, keyword),
          ),
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(users)
          .where(whereClause)
          .limit(params.limit)
          .offset(params.offset),
        this.executor.select({ count: count() }).from(users).where(whereClause),
      ]);

      return {
        users: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list users",
        error,
      );
    }
  }

  async listGuestUsers(
    _params: GuestUserListParams,
  ): Promise<GuestUserListResult> {
    // TODO: Implement guest user listing with guest space joins and license info
    return {
      guestUsers: [],
      totalCount: 0,
      trialCount: 0,
      paidCount: 0,
      licensedCount: 0,
    };
  }
}
