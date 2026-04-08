import type { InferSelectModel } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import { appTemplates } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppTemplate } from "@/core/domain/app/entity";
import type { AppTemplateRepository } from "@/core/domain/app/ports/appTemplateRepository";
import type {
  AppId as AppIdType,
  AppTemplateId as AppTemplateIdType,
  AppTemplateName as AppTemplateNameType,
} from "@/core/domain/app/valueObject";
import { AppTemplateId, AppTemplateName } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type AppTemplateDataModel = InferSelectModel<typeof appTemplates>;

export class DrizzleSqliteAppTemplateRepository
  implements AppTemplateRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: AppTemplateDataModel): AppTemplate {
    return {
      templateId: data.id as AppTemplateIdType,
      name: data.name as AppTemplateNameType,
      description: data.description,
      sourceAppId:
        data.sourceAppId !== null ? (data.sourceAppId as AppIdType) : null,
      creatorId: data.creatorId as UserId,
      createdAt: data.createdAt,
    };
  }

  async findById(templateId: AppTemplateIdType): Promise<AppTemplate | null> {
    try {
      const results = await this.executor
        .select()
        .from(appTemplates)
        .where(eq(appTemplates.id, templateId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app template by id",
        error,
      );
    }
  }

  async list(
    offset: number,
    limit: number,
  ): Promise<{ templates: AppTemplate[]; totalCount: number }> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor.select().from(appTemplates).limit(limit).offset(offset),
        this.executor.select({ count: sql`count(*)` }).from(appTemplates),
      ]);

      return {
        templates: items.map((item) => this.into(item)),
        totalCount: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list app templates",
        error,
      );
    }
  }

  async save(template: AppTemplate): Promise<void> {
    try {
      await this.executor
        .insert(appTemplates)
        .values({
          id: template.templateId,
          name: template.name,
          description: template.description,
          sourceAppId: template.sourceAppId,
          creatorId: template.creatorId,
          createdAt: template.createdAt,
        })
        .onConflictDoUpdate({
          target: appTemplates.id,
          set: {
            name: template.name,
            description: template.description,
            sourceAppId: template.sourceAppId,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save app template",
        error,
      );
    }
  }

  async delete(templateId: AppTemplateIdType): Promise<void> {
    try {
      await this.executor
        .delete(appTemplates)
        .where(eq(appTemplates.id, templateId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete app template",
        error,
      );
    }
  }

  async exportToFile(_templateId: AppTemplateIdType): Promise<ArrayBuffer> {
    // Stub: In a real implementation, this would serialize template config to a file
    try {
      const template = await this.findById(_templateId);
      if (!template) {
        throw new SystemError(
          SystemErrorCode.DatabaseError,
          "Template not found for export",
        );
      }
      const data = JSON.stringify({
        name: template.name,
        description: template.description,
        sourceAppId: template.sourceAppId,
      });
      const encoder = new TextEncoder();
      return encoder.encode(data).buffer as ArrayBuffer;
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to export app template to file",
        error,
      );
    }
  }

  async importFromFile(
    file: ArrayBuffer,
    name: AppTemplateNameType,
    creatorId: UserId,
  ): Promise<AppTemplate> {
    // Stub: In a real implementation, this would deserialize template config from a file
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(file);
      const data = JSON.parse(text) as {
        description?: string | null;
        sourceAppId?: string | null;
      };

      const template: AppTemplate = {
        templateId: AppTemplateId.generate(),
        name: AppTemplateName.create(name),
        description: data.description ?? null,
        sourceAppId: data.sourceAppId ? (data.sourceAppId as AppIdType) : null,
        creatorId,
        createdAt: new Date(),
      };

      await this.save(template);
      return template;
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to import app template from file",
        error,
      );
    }
  }
}
