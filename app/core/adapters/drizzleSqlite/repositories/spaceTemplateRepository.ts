import type { InferSelectModel } from "drizzle-orm";
import { count, eq } from "drizzle-orm";
import { spaceTemplates } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { RelatedLink, SpaceTemplate } from "@/core/domain/space/entity";
import type { SpaceTemplateRepository } from "@/core/domain/space/ports/spaceTemplateRepository";
import type {
  AppCreationPermission as AppCreationPermissionType,
  AppId as AppIdType,
  CoverImage as CoverImageType,
  PortalDisplayConfig as PortalDisplayConfigType,
  SpaceId as SpaceIdType,
  SpaceTemplateId as SpaceTemplateIdType,
} from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

type SpaceTemplateDataModel = InferSelectModel<typeof spaceTemplates>;

export class DrizzleSqliteSpaceTemplateRepository
  implements SpaceTemplateRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: SpaceTemplateDataModel): SpaceTemplate {
    return {
      templateId: data.id as SpaceTemplateIdType,
      name: data.name,
      sourceSpaceId: data.sourceSpaceId as SpaceIdType,
      useMultiThread: data.useMultiThread,
      fixedMember: data.fixedMember,
      appCreationPermission:
        data.appCreationPermission as AppCreationPermissionType,
      coverImage: data.coverImage as unknown as CoverImageType,
      portalDisplay: data.portalDisplay as unknown as PortalDisplayConfigType,
      threadNames: data.threadNames as unknown as readonly string[],
      appIds: data.appIds as unknown as readonly AppIdType[],
      relatedLinks: data.relatedLinks as unknown as readonly RelatedLink[],
      announcementBody: data.announcementBody,
      createdAt: data.createdAt,
    };
  }

  async findById(
    templateId: SpaceTemplateIdType,
  ): Promise<SpaceTemplate | null> {
    try {
      const results = await this.executor
        .select()
        .from(spaceTemplates)
        .where(eq(spaceTemplates.id, templateId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find space template by id",
        error,
      );
    }
  }

  async list(
    offset: number,
    limit: number,
  ): Promise<{ templates: SpaceTemplate[]; totalCount: number }> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor.select().from(spaceTemplates).limit(limit).offset(offset),
        this.executor.select({ count: count() }).from(spaceTemplates),
      ]);

      return {
        templates: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list space templates",
        error,
      );
    }
  }

  async save(template: SpaceTemplate): Promise<void> {
    try {
      await this.executor
        .insert(spaceTemplates)
        .values({
          id: template.templateId,
          name: template.name,
          sourceSpaceId: template.sourceSpaceId,
          useMultiThread: template.useMultiThread,
          fixedMember: template.fixedMember,
          appCreationPermission: template.appCreationPermission,
          coverImage: template.coverImage as unknown as Record<string, unknown>,
          portalDisplay: template.portalDisplay as unknown as Record<
            string,
            unknown
          >,
          threadNames: template.threadNames as unknown as string[],
          appIds: template.appIds as unknown as string[],
          relatedLinks: template.relatedLinks as unknown as Record<
            string,
            unknown
          >[],
          announcementBody: template.announcementBody,
          createdAt: template.createdAt,
        })
        .onConflictDoUpdate({
          target: spaceTemplates.id,
          set: {
            name: template.name,
            sourceSpaceId: template.sourceSpaceId,
            useMultiThread: template.useMultiThread,
            fixedMember: template.fixedMember,
            appCreationPermission: template.appCreationPermission,
            coverImage: template.coverImage as unknown as Record<
              string,
              unknown
            >,
            portalDisplay: template.portalDisplay as unknown as Record<
              string,
              unknown
            >,
            threadNames: template.threadNames as unknown as string[],
            appIds: template.appIds as unknown as string[],
            relatedLinks: template.relatedLinks as unknown as Record<
              string,
              unknown
            >[],
            announcementBody: template.announcementBody,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save space template",
        error,
      );
    }
  }

  async delete(templateId: SpaceTemplateIdType): Promise<void> {
    try {
      await this.executor
        .delete(spaceTemplates)
        .where(eq(spaceTemplates.id, templateId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete space template",
        error,
      );
    }
  }
}
