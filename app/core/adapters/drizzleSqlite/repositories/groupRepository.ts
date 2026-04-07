import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq, like, or } from "drizzle-orm";
import { groups } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Group } from "@/core/domain/identity/entity";
import type {
  GroupListParams,
  GroupListResult,
  GroupRepository,
} from "@/core/domain/identity/ports/groupRepository";
import type { GroupId as GroupIdType } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type GroupDataModel = InferSelectModel<typeof groups>;

export class DrizzleSqliteGroupRepository implements GroupRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: GroupDataModel): Group {
    return {
      groupId: data.id as GroupIdType,
      name: data.name,
      code: data.code,
    };
  }

  async findById(groupId: GroupIdType): Promise<Group | null> {
    try {
      const results = await this.executor
        .select()
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find group by id",
        error,
      );
    }
  }

  async findByCode(code: string): Promise<Group | null> {
    try {
      const results = await this.executor
        .select()
        .from(groups)
        .where(eq(groups.code, code))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find group by code",
        error,
      );
    }
  }

  async save(group: Group): Promise<void> {
    try {
      await this.executor
        .insert(groups)
        .values({
          id: group.groupId,
          name: group.name,
          code: group.code,
        })
        .onConflictDoUpdate({
          target: groups.id,
          set: {
            name: group.name,
            code: group.code,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save group",
        error,
      );
    }
  }

  async delete(groupId: GroupIdType): Promise<void> {
    try {
      await this.executor.delete(groups).where(eq(groups.id, groupId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete group",
        error,
      );
    }
  }

  async list(params: GroupListParams): Promise<GroupListResult> {
    try {
      const conditions = [];

      if (params.keyword !== undefined && params.keyword !== "") {
        const keyword = `%${params.keyword}%`;
        conditions.push(
          or(like(groups.name, keyword), like(groups.code, keyword)),
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(groups)
          .where(whereClause)
          .limit(params.limit)
          .offset(params.offset),
        this.executor
          .select({ count: count() })
          .from(groups)
          .where(whereClause),
      ]);

      return {
        groups: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list groups",
        error,
      );
    }
  }
}
