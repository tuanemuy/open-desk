import type { InferSelectModel } from "drizzle-orm";
import { asc, eq } from "drizzle-orm";
import {
  userAccessDates,
  userAccessUsages,
  users,
} from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserAccessUsage } from "@/core/domain/audit/entity";
import type { UserAccessUsageRepository } from "@/core/domain/audit/ports/userAccessUsageRepository";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type UserAccessUsageDataModel = InferSelectModel<typeof userAccessUsages>;

export class DrizzleSqliteUserAccessUsageRepository
  implements UserAccessUsageRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: UserAccessUsageDataModel): UserAccessUsage {
    return {
      userId: data.userId as UserIdType,
      lastAccessDate: data.lastAccessDate,
      accessDaysLast30: data.accessDaysLast30,
    };
  }

  async findByUserId(userId: UserIdType): Promise<UserAccessUsage | null> {
    try {
      const results = await this.executor
        .select()
        .from(userAccessUsages)
        .where(eq(userAccessUsages.userId, userId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find user access usage by user id",
        error,
      );
    }
  }

  async findAll(): Promise<UserAccessUsage[]> {
    try {
      const results = await this.executor
        .select({
          id: userAccessUsages.id,
          userId: userAccessUsages.userId,
          lastAccessDate: userAccessUsages.lastAccessDate,
          accessDaysLast30: userAccessUsages.accessDaysLast30,
          createdAt: userAccessUsages.createdAt,
          updatedAt: userAccessUsages.updatedAt,
        })
        .from(userAccessUsages)
        .innerJoin(users, eq(userAccessUsages.userId, users.id))
        .orderBy(asc(users.displayName));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all user access usages",
        error,
      );
    }
  }

  async findAllForExport(): Promise<UserAccessUsage[]> {
    try {
      const results = await this.executor
        .select({
          id: userAccessUsages.id,
          userId: userAccessUsages.userId,
          lastAccessDate: userAccessUsages.lastAccessDate,
          accessDaysLast30: userAccessUsages.accessDaysLast30,
          createdAt: userAccessUsages.createdAt,
          updatedAt: userAccessUsages.updatedAt,
        })
        .from(userAccessUsages)
        .innerJoin(users, eq(userAccessUsages.userId, users.id))
        .orderBy(asc(users.displayName));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all user access usages for export",
        error,
      );
    }
  }

  async save(usage: UserAccessUsage): Promise<void> {
    try {
      await this.executor
        .insert(userAccessUsages)
        .values({
          userId: usage.userId,
          lastAccessDate: usage.lastAccessDate,
          accessDaysLast30: usage.accessDaysLast30,
        })
        .onConflictDoUpdate({
          target: userAccessUsages.userId,
          set: {
            lastAccessDate: usage.lastAccessDate,
            accessDaysLast30: usage.accessDaysLast30,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save user access usage",
        error,
      );
    }
  }

  async deleteByUserId(userId: UserIdType): Promise<void> {
    try {
      await this.executor
        .delete(userAccessUsages)
        .where(eq(userAccessUsages.userId, userId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete user access usage by user id",
        error,
      );
    }
  }

  async findAccessDatesLast30Days(userId: UserIdType): Promise<Date[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const results = await this.executor
        .select({ accessDate: userAccessDates.accessDate })
        .from(userAccessDates)
        .where(eq(userAccessDates.userId, userId))
        .orderBy(asc(userAccessDates.accessDate));

      // Filter in application layer to handle timestamp comparison correctly
      return results
        .map((r) => r.accessDate)
        .filter((date) => date >= thirtyDaysAgo);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find access dates last 30 days",
        error,
      );
    }
  }
}
