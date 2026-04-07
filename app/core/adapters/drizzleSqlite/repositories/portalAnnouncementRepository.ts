import type { InferSelectModel } from "drizzle-orm";
import { desc, eq } from "drizzle-orm";
import { portalAnnouncements } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { PortalAnnouncement } from "@/core/domain/portal/entity";
import type { PortalAnnouncementRepository } from "@/core/domain/portal/ports/portalAnnouncementRepository";
import type {
  AnnouncementId as AnnouncementIdType,
  FileKey as FileKeyType,
  RichTextHtml as RichTextHtmlType,
} from "@/core/domain/portal/valueObject";
import type { Executor } from "../client";

type PortalAnnouncementDataModel = InferSelectModel<typeof portalAnnouncements>;

export class DrizzleSqlitePortalAnnouncementRepository
  implements PortalAnnouncementRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: PortalAnnouncementDataModel): PortalAnnouncement {
    return {
      announcementId: data.id as AnnouncementIdType,
      title: data.title,
      body: data.body as RichTextHtmlType,
      attachmentFileKeys:
        data.attachmentFileKeys as unknown as readonly FileKeyType[],
      lastUpdatedBy: data.lastUpdatedBy as UserIdType,
      updatedAt: data.updatedAt,
      createdAt: data.createdAt,
    };
  }

  async findLatest(): Promise<PortalAnnouncement | null> {
    try {
      const results = await this.executor
        .select()
        .from(portalAnnouncements)
        .orderBy(desc(portalAnnouncements.updatedAt))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find latest portal announcement",
        error,
      );
    }
  }

  async findById(
    announcementId: AnnouncementIdType,
  ): Promise<PortalAnnouncement | null> {
    try {
      const results = await this.executor
        .select()
        .from(portalAnnouncements)
        .where(eq(portalAnnouncements.id, announcementId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find portal announcement by id",
        error,
      );
    }
  }

  async save(announcement: PortalAnnouncement): Promise<void> {
    try {
      await this.executor
        .insert(portalAnnouncements)
        .values({
          id: announcement.announcementId,
          title: announcement.title,
          body: announcement.body,
          attachmentFileKeys:
            announcement.attachmentFileKeys as unknown as string[],
          lastUpdatedBy: announcement.lastUpdatedBy,
          createdAt: announcement.createdAt,
          updatedAt: announcement.updatedAt,
        })
        .onConflictDoUpdate({
          target: portalAnnouncements.id,
          set: {
            title: announcement.title,
            body: announcement.body,
            attachmentFileKeys:
              announcement.attachmentFileKeys as unknown as string[],
            lastUpdatedBy: announcement.lastUpdatedBy,
            updatedAt: announcement.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save portal announcement",
        error,
      );
    }
  }
}
