import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { spaceAnnouncements } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { SpaceAnnouncement } from "@/core/domain/space/entity";
import type { SpaceAnnouncementRepository } from "@/core/domain/space/ports/spaceAnnouncementRepository";
import type { SpaceId as SpaceIdType } from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

type SpaceAnnouncementDataModel = InferSelectModel<typeof spaceAnnouncements>;

export class DrizzleSqliteSpaceAnnouncementRepository
  implements SpaceAnnouncementRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: SpaceAnnouncementDataModel): SpaceAnnouncement {
    return {
      spaceId: data.spaceId as SpaceIdType,
      body: data.body,
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy as UserIdType,
    };
  }

  async findBySpaceId(spaceId: SpaceIdType): Promise<SpaceAnnouncement | null> {
    try {
      const results = await this.executor
        .select()
        .from(spaceAnnouncements)
        .where(eq(spaceAnnouncements.spaceId, spaceId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find space announcement by space id",
        error,
      );
    }
  }

  async save(announcement: SpaceAnnouncement): Promise<void> {
    try {
      await this.executor
        .insert(spaceAnnouncements)
        .values({
          spaceId: announcement.spaceId,
          body: announcement.body,
          updatedBy: announcement.updatedBy,
          updatedAt: announcement.updatedAt,
        })
        .onConflictDoUpdate({
          target: spaceAnnouncements.spaceId,
          set: {
            body: announcement.body,
            updatedBy: announcement.updatedBy,
            updatedAt: announcement.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save space announcement",
        error,
      );
    }
  }

  async deleteBySpaceId(spaceId: SpaceIdType): Promise<void> {
    try {
      await this.executor
        .delete(spaceAnnouncements)
        .where(eq(spaceAnnouncements.spaceId, spaceId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete space announcement by space id",
        error,
      );
    }
  }
}
