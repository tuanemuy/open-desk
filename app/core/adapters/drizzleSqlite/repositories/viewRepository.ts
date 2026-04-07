import type { InferSelectModel, SQL } from "drizzle-orm";
import { and, count, eq, ne } from "drizzle-orm";
import { views } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { View } from "@/core/domain/app/entity";
import type { ViewRepository } from "@/core/domain/app/ports/viewRepository";
import type {
  AppId as AppIdType,
  BuiltinViewType as BuiltinViewTypeType,
  DeviceScope as DeviceScopeType,
  FieldCode as FieldCodeType,
  SortSpec as SortSpecType,
  ViewId as ViewIdType,
  ViewType as ViewTypeType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type ViewDataModel = InferSelectModel<typeof views>;

export class DrizzleSqliteViewRepository implements ViewRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: ViewDataModel): View {
    return {
      viewId: data.id as ViewIdType,
      appId: data.appId as AppIdType,
      viewName: data.viewName,
      viewType: data.viewType as ViewTypeType,
      fields: data.fields as unknown as readonly FieldCodeType[],
      calendarDateField:
        data.calendarDateField !== null
          ? (data.calendarDateField as FieldCodeType)
          : null,
      calendarTitleField:
        data.calendarTitleField !== null
          ? (data.calendarTitleField as FieldCodeType)
          : null,
      html: data.html,
      pager: data.pager,
      deviceScope:
        data.deviceScope !== null
          ? (data.deviceScope as DeviceScopeType)
          : null,
      filterCondition: data.filterCondition,
      sort: data.sort as unknown as readonly SortSpecType[],
      index: data.index,
      builtinType:
        data.builtinType !== null
          ? (data.builtinType as BuiltinViewTypeType)
          : null,
    };
  }

  async findById(viewId: ViewIdType): Promise<View | null> {
    try {
      const results = await this.executor
        .select()
        .from(views)
        .where(eq(views.id, viewId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find view by id",
        error,
      );
    }
  }

  async findByAppId(appId: AppIdType): Promise<readonly View[]> {
    try {
      const results = await this.executor
        .select()
        .from(views)
        .where(eq(views.appId, appId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find views by app id",
        error,
      );
    }
  }

  async save(view: View): Promise<void> {
    try {
      await this.executor
        .insert(views)
        .values({
          id: view.viewId,
          appId: view.appId,
          viewName: view.viewName,
          viewType: view.viewType,
          fields: view.fields as unknown as Record<string, unknown>[],
          calendarDateField: view.calendarDateField,
          calendarTitleField: view.calendarTitleField,
          html: view.html,
          pager: view.pager,
          deviceScope: view.deviceScope,
          filterCondition: view.filterCondition,
          sort: view.sort as unknown as Record<string, unknown>[],
          index: view.index,
          builtinType: view.builtinType,
        })
        .onConflictDoUpdate({
          target: views.id,
          set: {
            appId: view.appId,
            viewName: view.viewName,
            viewType: view.viewType,
            fields: view.fields as unknown as Record<string, unknown>[],
            calendarDateField: view.calendarDateField,
            calendarTitleField: view.calendarTitleField,
            html: view.html,
            pager: view.pager,
            deviceScope: view.deviceScope,
            filterCondition: view.filterCondition,
            sort: view.sort as unknown as Record<string, unknown>[],
            index: view.index,
            builtinType: view.builtinType,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save view",
        error,
      );
    }
  }

  async delete(viewId: ViewIdType): Promise<void> {
    try {
      await this.executor.delete(views).where(eq(views.id, viewId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete view",
        error,
      );
    }
  }

  async existsByName(
    appId: AppIdType,
    viewName: string,
    excludeViewId?: ViewIdType,
  ): Promise<boolean> {
    try {
      const conditions: SQL[] = [
        eq(views.appId, appId),
        eq(views.viewName, viewName),
      ];
      if (excludeViewId !== undefined) {
        conditions.push(ne(views.id, excludeViewId));
      }

      const results = await this.executor
        .select({ count: count() })
        .from(views)
        .where(and(...conditions));

      return (results[0]?.count ?? 0) > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check view existence by name",
        error,
      );
    }
  }
}
