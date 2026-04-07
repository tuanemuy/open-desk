import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq, inArray, like, or } from "drizzle-orm";
import { spaceMembers, spaces } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Space } from "@/core/domain/space/entity";
import type {
  SpaceListFilter,
  SpaceRepository,
} from "@/core/domain/space/ports/spaceRepository";
import type {
  AppCreationPermission as AppCreationPermissionType,
  CoverImage as CoverImageType,
  PortalDisplayConfig as PortalDisplayConfigType,
  SpaceId as SpaceIdType,
  SpaceName as SpaceNameType,
  ThreadId as ThreadIdType,
} from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

type SpaceDataModel = InferSelectModel<typeof spaces>;

export class DrizzleSqliteSpaceRepository implements SpaceRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: SpaceDataModel): Space {
    return {
      spaceId: data.id as SpaceIdType,
      name: data.name as SpaceNameType,
      isPrivate: data.isPrivate,
      isGuest: data.isGuest,
      useMultiThread: data.useMultiThread,
      fixedMember: data.fixedMember,
      coverImage: data.coverImage as unknown as CoverImageType,
      portalDisplay: data.portalDisplay as unknown as PortalDisplayConfigType,
      appCreationPermission:
        data.appCreationPermission as AppCreationPermissionType,
      defaultThreadId: data.defaultThreadId as ThreadIdType,
      creatorId: data.creatorId as UserIdType,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async findById(spaceId: SpaceIdType): Promise<Space | null> {
    try {
      const results = await this.executor
        .select()
        .from(spaces)
        .where(eq(spaces.id, spaceId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find space by id",
        error,
      );
    }
  }

  async list(
    filter: SpaceListFilter,
    offset: number,
    limit: number,
  ): Promise<Space[]> {
    try {
      const conditions = [];

      if (filter.isGuest !== undefined) {
        conditions.push(eq(spaces.isGuest, filter.isGuest));
      }

      if (filter.isPrivate !== undefined) {
        conditions.push(eq(spaces.isPrivate, filter.isPrivate));
      }

      if (filter.keyword !== undefined && filter.keyword !== "") {
        conditions.push(like(spaces.name, `%${filter.keyword}%`));
      }

      if (filter.memberUserId !== undefined) {
        const memberSpaceIdsSq = this.executor
          .select({ spaceId: spaceMembers.spaceId })
          .from(spaceMembers)
          .where(
            and(
              eq(spaceMembers.entityType, "USER"),
              eq(spaceMembers.entityId, filter.memberUserId),
            ),
          );

        conditions.push(
          or(
            eq(spaces.creatorId, filter.memberUserId),
            inArray(spaces.id, memberSpaceIdsSq),
          ),
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const results = await this.executor
        .select()
        .from(spaces)
        .where(whereClause)
        .limit(limit)
        .offset(offset);

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list spaces",
        error,
      );
    }
  }

  async count(filter: SpaceListFilter): Promise<number> {
    try {
      const conditions = [];

      if (filter.isGuest !== undefined) {
        conditions.push(eq(spaces.isGuest, filter.isGuest));
      }

      if (filter.isPrivate !== undefined) {
        conditions.push(eq(spaces.isPrivate, filter.isPrivate));
      }

      if (filter.keyword !== undefined && filter.keyword !== "") {
        conditions.push(like(spaces.name, `%${filter.keyword}%`));
      }

      if (filter.memberUserId !== undefined) {
        const memberSpaceIdsSq = this.executor
          .select({ spaceId: spaceMembers.spaceId })
          .from(spaceMembers)
          .where(
            and(
              eq(spaceMembers.entityType, "USER"),
              eq(spaceMembers.entityId, filter.memberUserId),
            ),
          );

        conditions.push(
          or(
            eq(spaces.creatorId, filter.memberUserId),
            inArray(spaces.id, memberSpaceIdsSq),
          ),
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.executor
        .select({ count: count() })
        .from(spaces)
        .where(whereClause);

      return result[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count spaces",
        error,
      );
    }
  }

  async countRegular(): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: count() })
        .from(spaces)
        .where(eq(spaces.isGuest, false));

      return result[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count regular spaces",
        error,
      );
    }
  }

  async countGuest(): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: count() })
        .from(spaces)
        .where(eq(spaces.isGuest, true));

      return result[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count guest spaces",
        error,
      );
    }
  }

  async save(space: Space): Promise<void> {
    try {
      await this.executor
        .insert(spaces)
        .values({
          id: space.spaceId,
          name: space.name,
          isPrivate: space.isPrivate,
          isGuest: space.isGuest,
          useMultiThread: space.useMultiThread,
          fixedMember: space.fixedMember,
          coverImage: space.coverImage as Record<string, unknown>,
          portalDisplay: space.portalDisplay as Record<string, unknown>,
          appCreationPermission: space.appCreationPermission,
          defaultThreadId: space.defaultThreadId,
          creatorId: space.creatorId,
          createdAt: space.createdAt,
          updatedAt: space.updatedAt,
        })
        .onConflictDoUpdate({
          target: spaces.id,
          set: {
            name: space.name,
            isPrivate: space.isPrivate,
            isGuest: space.isGuest,
            useMultiThread: space.useMultiThread,
            fixedMember: space.fixedMember,
            coverImage: space.coverImage as Record<string, unknown>,
            portalDisplay: space.portalDisplay as Record<string, unknown>,
            appCreationPermission: space.appCreationPermission,
            defaultThreadId: space.defaultThreadId,
            updatedAt: space.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save space",
        error,
      );
    }
  }

  async delete(spaceId: SpaceIdType): Promise<void> {
    try {
      await this.executor.delete(spaces).where(eq(spaces.id, spaceId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete space",
        error,
      );
    }
  }
}
