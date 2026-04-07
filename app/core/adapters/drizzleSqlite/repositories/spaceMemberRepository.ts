import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq } from "drizzle-orm";
import { spaceMembers } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { SpaceMember } from "@/core/domain/space/entity";
import type { SpaceMemberRepository } from "@/core/domain/space/ports/spaceMemberRepository";
import type {
  MemberEntity as MemberEntityType,
  MemberEntityType as MemberEntityTypeType,
  SpaceId as SpaceIdType,
} from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

type SpaceMemberDataModel = InferSelectModel<typeof spaceMembers>;

export class DrizzleSqliteSpaceMemberRepository
  implements SpaceMemberRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: SpaceMemberDataModel): SpaceMember {
    return {
      spaceId: data.spaceId as SpaceIdType,
      entity: {
        type: data.entityType as MemberEntityTypeType,
        id: data.entityId as UserIdType,
        code: data.entityCode,
      } as MemberEntityType,
      isAdmin: data.isAdmin,
      includeSubs: data.includeSubs,
    };
  }

  async findBySpaceId(spaceId: SpaceIdType): Promise<SpaceMember[]> {
    try {
      const results = await this.executor
        .select()
        .from(spaceMembers)
        .where(eq(spaceMembers.spaceId, spaceId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find space members by space id",
        error,
      );
    }
  }

  async findAdminsBySpaceId(spaceId: SpaceIdType): Promise<SpaceMember[]> {
    try {
      const results = await this.executor
        .select()
        .from(spaceMembers)
        .where(
          and(
            eq(spaceMembers.spaceId, spaceId),
            eq(spaceMembers.isAdmin, true),
          ),
        );

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find admin space members by space id",
        error,
      );
    }
  }

  async findBySpaceIdAndUserId(
    spaceId: SpaceIdType,
    userId: UserIdType,
  ): Promise<SpaceMember | null> {
    try {
      const results = await this.executor
        .select()
        .from(spaceMembers)
        .where(
          and(
            eq(spaceMembers.spaceId, spaceId),
            eq(spaceMembers.entityType, "USER"),
            eq(spaceMembers.entityId, userId),
          ),
        )
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find space member by space id and user id",
        error,
      );
    }
  }

  async findByUserId(userId: UserIdType): Promise<SpaceMember[]> {
    try {
      const results = await this.executor
        .select()
        .from(spaceMembers)
        .where(
          and(
            eq(spaceMembers.entityType, "USER"),
            eq(spaceMembers.entityId, userId),
          ),
        );

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find space members by user id",
        error,
      );
    }
  }

  async countAdminsBySpaceId(spaceId: SpaceIdType): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: count() })
        .from(spaceMembers)
        .where(
          and(
            eq(spaceMembers.spaceId, spaceId),
            eq(spaceMembers.isAdmin, true),
          ),
        );

      return result[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count admin space members by space id",
        error,
      );
    }
  }

  async save(member: SpaceMember): Promise<void> {
    try {
      await this.executor
        .insert(spaceMembers)
        .values({
          spaceId: member.spaceId,
          entityType: member.entity.type,
          entityId: member.entity.id,
          entityCode: member.entity.code,
          isAdmin: member.isAdmin,
          includeSubs: member.includeSubs,
        })
        .onConflictDoUpdate({
          target: [
            spaceMembers.spaceId,
            spaceMembers.entityType,
            spaceMembers.entityId,
          ],
          set: {
            entityCode: member.entity.code,
            isAdmin: member.isAdmin,
            includeSubs: member.includeSubs,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save space member",
        error,
      );
    }
  }

  async delete(spaceId: SpaceIdType, entity: MemberEntityType): Promise<void> {
    try {
      await this.executor
        .delete(spaceMembers)
        .where(
          and(
            eq(spaceMembers.spaceId, spaceId),
            eq(spaceMembers.entityType, entity.type),
            eq(spaceMembers.entityId, entity.id),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete space member",
        error,
      );
    }
  }

  async deleteBySpaceId(spaceId: SpaceIdType): Promise<void> {
    try {
      await this.executor
        .delete(spaceMembers)
        .where(eq(spaceMembers.spaceId, spaceId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete space members by space id",
        error,
      );
    }
  }

  async replaceAll(
    spaceId: SpaceIdType,
    members: SpaceMember[],
  ): Promise<void> {
    try {
      await this.executor
        .delete(spaceMembers)
        .where(eq(spaceMembers.spaceId, spaceId));

      if (members.length > 0) {
        await this.executor.insert(spaceMembers).values(
          members.map((member) => ({
            spaceId: member.spaceId,
            entityType: member.entity.type,
            entityId: member.entity.id,
            entityCode: member.entity.code,
            isAdmin: member.isAdmin,
            includeSubs: member.includeSubs,
          })),
        );
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to replace all space members",
        error,
      );
    }
  }
}
