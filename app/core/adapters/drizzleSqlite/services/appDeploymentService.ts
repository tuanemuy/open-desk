import { eq, inArray } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Field } from "@/core/domain/app/entity";
import type {
  AppDeploymentService,
  DeploymentValidationResult,
  DeployStatus,
} from "@/core/domain/app/services/appDeploymentService";
import type {
  AppId as AppIdType,
  FieldCode as FieldCodeType,
  FieldProperties,
  LayoutField as LayoutFieldType,
  LayoutRow as LayoutRowType,
  ReportAggregation as ReportAggregationType,
  ReportGroup as ReportGroupType,
  SortSpec as SortSpecType,
} from "@/core/domain/app/valueObject";
import type { Database } from "../client";
import { apps, fields, formLayouts, reports, views } from "../schema";

/**
 * Drizzle SQLite implementation of AppDeploymentService.
 *
 * Validates app configurations and manages deployment status transitions
 * between PREVIEW and ACTIVE states.
 */
export class DrizzleSqliteAppDeploymentService implements AppDeploymentService {
  constructor(private readonly db: Database) {}

  async validateForDeployment(
    appId: AppIdType,
  ): Promise<DeploymentValidationResult> {
    const errors: string[] = [];

    try {
      // 1. Fetch the app
      const appRows = await this.db
        .select()
        .from(apps)
        .where(eq(apps.id, appId));

      if (appRows.length === 0) {
        return { appId, isValid: false, errors: ["App not found"] };
      }

      const app = appRows[0];

      // 2. Check app is in PREVIEW status
      if (app.status !== "PREVIEW") {
        errors.push(
          `App must be in PREVIEW status for deployment, but is in ${app.status} status`,
        );
      }

      // 3. Fetch field definitions
      const fieldDefs = await this.fetchFieldDefinitions(appId);
      const fieldCodeSet = new Set<string>(fieldDefs.map((f) => f.fieldCode));

      // 4. Validate form layout
      const layoutErrors = await this.validateFormLayout(appId, fieldCodeSet);
      for (const e of layoutErrors) {
        errors.push(e);
      }

      // 5. Validate required fields have proper configuration
      const fieldErrors = this.validateFieldDefinitions(fieldDefs);
      for (const e of fieldErrors) {
        errors.push(e);
      }

      // 6. Validate views reference valid fields
      const viewErrors = await this.validateViews(appId, fieldCodeSet);
      for (const e of viewErrors) {
        errors.push(e);
      }

      // 7. Validate reports reference valid fields
      const reportErrors = await this.validateReports(appId, fieldCodeSet);
      for (const e of reportErrors) {
        errors.push(e);
      }

      return { appId, isValid: errors.length === 0, errors };
    } catch (error) {
      if (
        error instanceof SystemError ||
        (error !== null &&
          typeof error === "object" &&
          "name" in error &&
          (error as { name: string }).name === "SystemError")
      ) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        `Failed to validate app ${appId} for deployment`,
        error,
      );
    }
  }

  async deployBatch(appIds: readonly AppIdType[]): Promise<void> {
    if (appIds.length === 0) {
      return;
    }

    try {
      // Validate all apps before deploying
      for (const appId of appIds) {
        const result = await this.validateForDeployment(appId);
        if (!result.isValid) {
          throw new SystemError(
            SystemErrorCode.InternalServerError,
            `App ${appId} is not valid for deployment: ${result.errors.join("; ")}`,
          );
        }
      }

      // Update all apps to ACTIVE status
      await this.db
        .update(apps)
        .set({ status: "ACTIVE", updatedAt: new Date() })
        .where(inArray(apps.id, [...appIds] as string[]));
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to deploy apps batch",
        error,
      );
    }
  }

  async getDeployStatus(
    appIds: readonly AppIdType[],
  ): Promise<readonly DeployStatus[]> {
    if (appIds.length === 0) {
      return [];
    }

    try {
      const appRows = await this.db
        .select({ id: apps.id, status: apps.status })
        .from(apps)
        .where(inArray(apps.id, [...appIds] as string[]));

      const statusMap = new Map<string, string>();
      for (const row of appRows) {
        statusMap.set(row.id, row.status);
      }

      return appIds.map((appId): DeployStatus => {
        const appStatus = statusMap.get(appId);

        if (!appStatus) {
          return { appId, status: "FAIL" };
        }

        // Map app status to deploy status:
        // ACTIVE means deployment succeeded
        // PREVIEW means not yet deployed (or reverted)
        // DELETED means deployment is effectively cancelled
        switch (appStatus) {
          case "ACTIVE":
            return { appId, status: "SUCCESS" };
          case "PREVIEW":
            return { appId, status: "CANCEL" };
          case "DELETED":
            return { appId, status: "CANCEL" };
          default:
            return { appId, status: "FAIL" };
        }
      });
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to get deploy status",
        error,
      );
    }
  }

  async revert(appId: AppIdType): Promise<void> {
    try {
      const appRows = await this.db
        .select({ id: apps.id, status: apps.status })
        .from(apps)
        .where(eq(apps.id, appId));

      if (appRows.length === 0) {
        throw new SystemError(
          SystemErrorCode.InternalServerError,
          `App ${appId} not found`,
        );
      }

      const app = appRows[0];
      if (app.status !== "ACTIVE") {
        throw new SystemError(
          SystemErrorCode.InternalServerError,
          `App ${appId} is not in ACTIVE status, cannot revert`,
        );
      }

      await this.db
        .update(apps)
        .set({ status: "PREVIEW", updatedAt: new Date() })
        .where(eq(apps.id, appId));
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        `Failed to revert app ${appId}`,
        error,
      );
    }
  }

  // ============================================
  // Private helpers
  // ============================================

  private async fetchFieldDefinitions(
    appId: AppIdType,
  ): Promise<readonly Field[]> {
    try {
      const results = await this.db
        .select()
        .from(fields)
        .where(eq(fields.appId, appId));

      return results.map((r) => ({
        fieldId: r.id as Field["fieldId"],
        appId: r.appId as Field["appId"],
        fieldCode: r.fieldCode as Field["fieldCode"],
        label: r.label,
        noLabel: r.noLabel,
        fieldType: r.fieldType as Field["fieldType"],
        required: r.required,
        unique: r.isUnique,
        defaultValue:
          r.defaultValue !== null
            ? (r.defaultValue as unknown as Field["defaultValue"])
            : null,
        properties: r.properties as unknown as FieldProperties,
      }));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch field definitions for deployment validation",
        error,
      );
    }
  }

  private async validateFormLayout(
    appId: AppIdType,
    fieldCodeSet: ReadonlySet<string>,
  ): Promise<readonly string[]> {
    const errors: string[] = [];

    try {
      const layoutRows = await this.db
        .select()
        .from(formLayouts)
        .where(eq(formLayouts.appId, appId));

      if (layoutRows.length === 0) {
        // No form layout is acceptable; it just means the app has a default layout
        return errors;
      }

      const layout = layoutRows[0];
      const rows = layout.rows as unknown as readonly LayoutRowType[];

      if (!Array.isArray(rows)) {
        errors.push("Form layout rows is not a valid array");
        return errors;
      }

      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const rowErrors = this.validateLayoutRowFields(
          row,
          fieldCodeSet,
          `row[${rowIdx}]`,
        );
        for (const e of rowErrors) {
          errors.push(e);
        }
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch form layout for deployment validation",
        error,
      );
    }

    return errors;
  }

  private validateLayoutRowFields(
    row: LayoutRowType,
    fieldCodeSet: ReadonlySet<string>,
    path: string,
  ): readonly string[] {
    const errors: string[] = [];
    const layoutFields = row.fields as readonly LayoutFieldType[];

    for (const layoutField of layoutFields) {
      // Layout-only elements (LABEL, SPACER, HR) may have null codes
      if (layoutField.code === null) {
        continue;
      }

      if (!fieldCodeSet.has(layoutField.code)) {
        errors.push(
          `Form layout ${path} references field code "${layoutField.code}" which does not exist`,
        );
      }
    }

    // Validate inner layout (for GROUP and SUBTABLE rows)
    if (row.innerLayout !== null && Array.isArray(row.innerLayout)) {
      for (let innerIdx = 0; innerIdx < row.innerLayout.length; innerIdx++) {
        const innerRow = row.innerLayout[innerIdx];
        const innerErrors = this.validateLayoutRowFields(
          innerRow,
          fieldCodeSet,
          `${path}.innerLayout[${innerIdx}]`,
        );
        for (const e of innerErrors) {
          errors.push(e);
        }
      }
    }

    return errors;
  }

  private validateFieldDefinitions(
    fieldDefs: readonly Field[],
  ): readonly string[] {
    const errors: string[] = [];

    for (const field of fieldDefs) {
      // Check that required fields have a matching properties type
      if (field.properties === null || field.properties === undefined) {
        errors.push(
          `Field "${field.fieldCode}" has no properties configuration`,
        );
        continue;
      }

      // Validate properties type matches field type
      const propsType = (field.properties as unknown as { type?: string }).type;
      if (propsType !== undefined && propsType !== field.fieldType) {
        errors.push(
          `Field "${field.fieldCode}" has properties type "${propsType}" which does not match field type "${field.fieldType}"`,
        );
      }
    }

    return errors;
  }

  private async validateViews(
    appId: AppIdType,
    fieldCodeSet: ReadonlySet<string>,
  ): Promise<readonly string[]> {
    const errors: string[] = [];

    try {
      const viewRows = await this.db
        .select()
        .from(views)
        .where(eq(views.appId, appId));

      for (const viewRow of viewRows) {
        const viewFields =
          viewRow.fields as unknown as readonly FieldCodeType[];

        if (Array.isArray(viewFields)) {
          for (const fieldCode of viewFields) {
            if (!fieldCodeSet.has(fieldCode)) {
              errors.push(
                `View "${viewRow.viewName}" references field code "${fieldCode}" which does not exist`,
              );
            }
          }
        }

        // Validate calendar date field reference
        if (
          viewRow.calendarDateField !== null &&
          !fieldCodeSet.has(viewRow.calendarDateField)
        ) {
          errors.push(
            `View "${viewRow.viewName}" references calendar date field "${viewRow.calendarDateField}" which does not exist`,
          );
        }

        // Validate calendar title field reference
        if (
          viewRow.calendarTitleField !== null &&
          !fieldCodeSet.has(viewRow.calendarTitleField)
        ) {
          errors.push(
            `View "${viewRow.viewName}" references calendar title field "${viewRow.calendarTitleField}" which does not exist`,
          );
        }

        // Validate sort field references
        const sortSpecs = viewRow.sort as unknown as readonly SortSpecType[];
        if (Array.isArray(sortSpecs)) {
          for (const sortSpec of sortSpecs) {
            if (
              sortSpec.fieldCode !== undefined &&
              !fieldCodeSet.has(sortSpec.fieldCode)
            ) {
              errors.push(
                `View "${viewRow.viewName}" sort references field code "${sortSpec.fieldCode}" which does not exist`,
              );
            }
          }
        }
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch views for deployment validation",
        error,
      );
    }

    return errors;
  }

  private async validateReports(
    appId: AppIdType,
    fieldCodeSet: ReadonlySet<string>,
  ): Promise<readonly string[]> {
    const errors: string[] = [];

    try {
      const reportRows = await this.db
        .select()
        .from(reports)
        .where(eq(reports.appId, appId));

      for (const reportRow of reportRows) {
        // Validate group field references
        const groups =
          reportRow.groups as unknown as readonly ReportGroupType[];
        if (Array.isArray(groups)) {
          for (const group of groups) {
            if (!fieldCodeSet.has(group.fieldCode)) {
              errors.push(
                `Report "${reportRow.reportName}" group references field code "${group.fieldCode}" which does not exist`,
              );
            }
          }
        }

        // Validate aggregation field references
        const aggregations =
          reportRow.aggregations as unknown as readonly ReportAggregationType[];
        if (Array.isArray(aggregations)) {
          for (const agg of aggregations) {
            // COUNT aggregation may have null fieldCode
            if (agg.fieldCode !== null && !fieldCodeSet.has(agg.fieldCode)) {
              errors.push(
                `Report "${reportRow.reportName}" aggregation references field code "${agg.fieldCode}" which does not exist`,
              );
            }
          }
        }
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch reports for deployment validation",
        error,
      );
    }

    return errors;
  }
}
