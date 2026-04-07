import type { InferSelectModel, SQL } from "drizzle-orm";
import { and, count, eq, inArray, like, ne } from "drizzle-orm";
import { apps } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { App } from "@/core/domain/app/entity";
import type {
  AppListFilter,
  AppRepository,
} from "@/core/domain/app/ports/appRepository";
import type {
  AppCode as AppCodeType,
  AppIcon as AppIconType,
  AppId as AppIdType,
  AppName as AppNameType,
  AppStatus as AppStatusType,
  AppTheme as AppThemeType,
  NumberPrecision as NumberPrecisionType,
  Revision as RevisionType,
  SpaceId as SpaceIdType,
  ThreadId as ThreadIdType,
  TitleFieldConfig as TitleFieldConfigType,
} from "@/core/domain/app/valueObject";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type AppDataModel = InferSelectModel<typeof apps>;

export class DrizzleSqliteAppRepository implements AppRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: AppDataModel): App {
    return {
      appId: data.id as AppIdType,
      code: data.code !== null ? (data.code as AppCodeType) : null,
      name: data.name as AppNameType,
      description: data.description,
      spaceId: data.spaceId !== null ? (data.spaceId as SpaceIdType) : null,
      threadId: data.threadId !== null ? (data.threadId as ThreadIdType) : null,
      theme: data.theme as AppThemeType,
      icon: data.icon as unknown as AppIconType,
      titleField: data.titleFieldConfig as unknown as TitleFieldConfigType,
      enableThumbnails: data.enableThumbnails,
      enableBulkDeletion: data.enableBulkDeletion,
      enableRecordHistory: data.enableRecordHistory,
      enableComments: data.enableComments,
      enableDuplicateRecord: data.enableDuplicateRecord,
      enableInlineEditing: data.enableInlineEditing,
      numberPrecision: data.numberPrecision as unknown as NumberPrecisionType,
      firstMonthOfFiscalYear: data.firstMonthOfFiscalYear,
      revision: data.revision as RevisionType,
      status: data.status as AppStatusType,
      creatorId: data.creatorId as UserIdType,
      modifierId: data.modifierId as UserIdType,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async findById(appId: AppIdType): Promise<App | null> {
    try {
      const results = await this.executor
        .select()
        .from(apps)
        .where(eq(apps.id, appId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app by id",
        error,
      );
    }
  }

  async findByCode(code: AppCodeType): Promise<App | null> {
    try {
      const results = await this.executor
        .select()
        .from(apps)
        .where(eq(apps.code, code))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app by code",
        error,
      );
    }
  }

  async findBySpaceId(
    spaceId: SpaceIdType,
    offset: number,
    limit: number,
  ): Promise<readonly App[]> {
    try {
      const results = await this.executor
        .select()
        .from(apps)
        .where(eq(apps.spaceId, spaceId))
        .offset(offset)
        .limit(limit);

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find apps by space id",
        error,
      );
    }
  }

  async list(
    filter: AppListFilter,
    offset: number,
    limit: number,
  ): Promise<readonly App[]> {
    try {
      const conditions = this.buildFilterConditions(filter);
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const results = await this.executor
        .select()
        .from(apps)
        .where(whereClause)
        .offset(offset)
        .limit(limit);

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list apps",
        error,
      );
    }
  }

  async count(filter: AppListFilter): Promise<number> {
    try {
      const conditions = this.buildFilterConditions(filter);
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const results = await this.executor
        .select({ count: count() })
        .from(apps)
        .where(whereClause);

      return results[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count apps",
        error,
      );
    }
  }

  async save(app: App): Promise<void> {
    try {
      await this.executor
        .insert(apps)
        .values({
          id: app.appId,
          code: app.code,
          name: app.name,
          description: app.description,
          spaceId: app.spaceId,
          threadId: app.threadId,
          theme: app.theme,
          icon: app.icon as Record<string, unknown>,
          titleFieldConfig: app.titleField as Record<string, unknown>,
          enableThumbnails: app.enableThumbnails,
          enableBulkDeletion: app.enableBulkDeletion,
          enableRecordHistory: app.enableRecordHistory,
          enableComments: app.enableComments,
          enableDuplicateRecord: app.enableDuplicateRecord,
          enableInlineEditing: app.enableInlineEditing,
          numberPrecision: app.numberPrecision as Record<string, unknown>,
          firstMonthOfFiscalYear: app.firstMonthOfFiscalYear,
          revision: app.revision,
          status: app.status,
          creatorId: app.creatorId,
          modifierId: app.modifierId,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        })
        .onConflictDoUpdate({
          target: apps.id,
          set: {
            code: app.code,
            name: app.name,
            description: app.description,
            spaceId: app.spaceId,
            threadId: app.threadId,
            theme: app.theme,
            icon: app.icon as Record<string, unknown>,
            titleFieldConfig: app.titleField as Record<string, unknown>,
            enableThumbnails: app.enableThumbnails,
            enableBulkDeletion: app.enableBulkDeletion,
            enableRecordHistory: app.enableRecordHistory,
            enableComments: app.enableComments,
            enableDuplicateRecord: app.enableDuplicateRecord,
            enableInlineEditing: app.enableInlineEditing,
            numberPrecision: app.numberPrecision as Record<string, unknown>,
            firstMonthOfFiscalYear: app.firstMonthOfFiscalYear,
            revision: app.revision,
            status: app.status,
            modifierId: app.modifierId,
            updatedAt: app.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save app",
        error,
      );
    }
  }

  async delete(appId: AppIdType): Promise<void> {
    try {
      await this.executor.delete(apps).where(eq(apps.id, appId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete app",
        error,
      );
    }
  }

  async existsByCode(
    code: AppCodeType,
    excludeAppId?: AppIdType,
  ): Promise<boolean> {
    try {
      const conditions: SQL[] = [eq(apps.code, code)];
      if (excludeAppId !== undefined) {
        conditions.push(ne(apps.id, excludeAppId));
      }

      const results = await this.executor
        .select({ count: count() })
        .from(apps)
        .where(and(...conditions));

      return (results[0]?.count ?? 0) > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check app existence by code",
        error,
      );
    }
  }

  async countAll(): Promise<number> {
    try {
      const results = await this.executor.select({ count: count() }).from(apps);

      return results[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count all apps",
        error,
      );
    }
  }

  private buildFilterConditions(filter: AppListFilter) {
    const conditions = [];

    if (filter.ids !== undefined && filter.ids.length > 0) {
      conditions.push(inArray(apps.id, [...filter.ids]));
    }

    if (filter.codes !== undefined && filter.codes.length > 0) {
      conditions.push(inArray(apps.code, [...filter.codes]));
    }

    if (filter.name !== undefined) {
      conditions.push(like(apps.name, `%${filter.name}%`));
    }

    if (filter.spaceIds !== undefined && filter.spaceIds.length > 0) {
      conditions.push(inArray(apps.spaceId, [...filter.spaceIds]));
    }

    if (filter.status !== undefined) {
      conditions.push(eq(apps.status, filter.status));
    }

    return conditions;
  }
}
