import { eq } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import {
  type App,
  App as AppFactory,
  type Field,
  Field as FieldFactory,
  type FormLayout,
  FormLayout as FormLayoutFactory,
  type Report,
  Report as ReportFactory,
  type View,
  View as ViewFactory,
} from "@/core/domain/app/entity";
import type {
  AppCreationResult,
  AppCreationService,
} from "@/core/domain/app/services/appCreationService";
import type {
  AppId,
  FieldCode as FieldCodeType,
  FieldProperties,
  SpaceId,
} from "@/core/domain/app/valueObject";
import {
  FieldCode,
  FieldId,
  FieldSize,
  LayoutField,
  LayoutRow,
} from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { Database } from "../client";
import { apps, fields, formLayouts, reports, views } from "../schema";

/**
 * System user ID used as the creator for apps created from file imports.
 */
const SYSTEM_USER_ID = "system" as UserId;

/**
 * Drizzle SQLite implementation of AppCreationService.
 *
 * Creates apps from templates, Excel/CSV files, and by duplicating existing apps.
 * Queries the database directly to read source app configuration for copy operations.
 */
export class DrizzleSqliteAppCreationService implements AppCreationService {
  constructor(private readonly db: Database) {}

  async createFromTemplate(
    templateId: AppId,
    name: string,
    spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    return this.copyAppConfiguration(templateId, name, spaceId);
  }

  async createFromExcel(
    file: ArrayBuffer,
    name: string,
    spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    const headers = this.parseExcelHeaders(file);
    return this.createAppFromHeaders(headers, name, spaceId);
  }

  async createFromCsv(
    file: ArrayBuffer,
    name: string,
    spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    const headers = this.parseCsvHeaders(file);
    return this.createAppFromHeaders(headers, name, spaceId);
  }

  async duplicateApp(
    sourceAppId: AppId,
    name: string,
    spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    return this.copyAppConfiguration(sourceAppId, name, spaceId);
  }

  /**
   * Copy all configuration from a source app to create a new app.
   * Used by both createFromTemplate and duplicateApp.
   */
  private async copyAppConfiguration(
    sourceAppId: AppId,
    name: string,
    spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    try {
      const sourceApp = await this.fetchApp(sourceAppId);
      if (sourceApp === null) {
        throw new SystemError(
          SystemErrorCode.DatabaseError,
          `Source app ${sourceAppId} not found`,
        );
      }

      const sourceFields = await this.fetchFields(sourceAppId);
      const sourceFormLayout = await this.fetchFormLayout(sourceAppId);
      const sourceViews = await this.fetchViews(sourceAppId);
      const sourceReports = await this.fetchReports(sourceAppId);

      // Create the new app
      const { entity: newApp } = AppFactory.create({
        name,
        creatorId: sourceApp.creatorId,
        spaceId,
      });

      // Build a mapping from old field IDs to new field IDs for layout references
      const fieldIdMapping = new Map<string, string>();
      const fieldCodeMapping = new Map<string, string>();

      // Create new fields with new IDs but same configuration
      const newFields: Field[] = [];
      for (const sourceField of sourceFields) {
        const newFieldId = FieldId.generate();
        fieldIdMapping.set(sourceField.fieldId, newFieldId);
        fieldCodeMapping.set(sourceField.fieldCode, sourceField.fieldCode);

        const newField: Field = {
          fieldId: newFieldId,
          appId: newApp.appId,
          fieldCode: sourceField.fieldCode,
          label: sourceField.label,
          noLabel: sourceField.noLabel,
          fieldType: sourceField.fieldType,
          required: sourceField.required,
          unique: sourceField.unique,
          defaultValue: sourceField.defaultValue,
          properties: sourceField.properties,
        };
        newFields.push(newField);
      }

      // Copy form layout with updated appId
      let newFormLayout: FormLayout | null = null;
      if (sourceFormLayout !== null) {
        newFormLayout = FormLayoutFactory.create({
          appId: newApp.appId,
          rows: sourceFormLayout.rows,
        });
      }

      // Copy views with new IDs
      const newViews: View[] = [];
      for (const sourceView of sourceViews) {
        const { entity: newView } = ViewFactory.create({
          appId: newApp.appId,
          viewName: sourceView.viewName,
          viewType: sourceView.viewType,
          fields: sourceView.fields,
          calendarDateField: sourceView.calendarDateField,
          calendarTitleField: sourceView.calendarTitleField,
          html: sourceView.html,
          pager: sourceView.pager,
          deviceScope: sourceView.deviceScope,
          filterCondition: sourceView.filterCondition,
          sort: sourceView.sort,
          index: sourceView.index,
          builtinType: sourceView.builtinType,
        });
        newViews.push(newView);
      }

      // Copy reports with new IDs
      const newReports: Report[] = [];
      for (const sourceReport of sourceReports) {
        const { entity: newReport } = ReportFactory.create({
          appId: newApp.appId,
          reportName: sourceReport.reportName,
          chartType: sourceReport.chartType,
          chartSubType: sourceReport.chartSubType,
          groups: sourceReport.groups,
          aggregations: sourceReport.aggregations,
          filterCondition: sourceReport.filterCondition,
          sort: sourceReport.sort,
        });
        newReports.push(newReport);
      }

      return {
        app: newApp,
        fields: newFields,
        formLayout: newFormLayout,
        views: newViews,
        reports: newReports,
      };
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to copy app configuration",
        error,
      );
    }
  }

  /**
   * Create an app from parsed column headers.
   * Each header becomes a SINGLE_LINE_TEXT field.
   * A default form layout and "All" list view are also created.
   */
  private createAppFromHeaders(
    headers: readonly string[],
    name: string,
    spaceId: SpaceId | null,
  ): AppCreationResult {
    const { entity: newApp } = AppFactory.create({
      name,
      creatorId: SYSTEM_USER_ID,
      spaceId,
    });

    const newFields: Field[] = [];
    const layoutFields: Array<{
      code: FieldCodeType;
      type: "SINGLE_LINE_TEXT";
    }> = [];

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim();
      if (header.length === 0) {
        continue;
      }

      const fieldCode = FieldCode.create(`field_${i}`);
      const properties: FieldProperties = {
        type: "SINGLE_LINE_TEXT",
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: null,
      };

      const { entity: field } = FieldFactory.create({
        appId: newApp.appId,
        fieldCode,
        label: header,
        fieldType: "SINGLE_LINE_TEXT",
        properties,
      });
      newFields.push(field);
      layoutFields.push({ code: field.fieldCode, type: "SINGLE_LINE_TEXT" });
    }

    // Build form layout rows - one field per row
    const layoutRows = layoutFields.map((lf) =>
      LayoutRow.create({
        type: "ROW",
        code: null,
        fields: [
          LayoutField.create({
            type: lf.type,
            code: lf.code,
            label: null,
            elementId: null,
            size: FieldSize.create({
              width: null,
              height: null,
              innerHeight: null,
            }),
          }),
        ],
        innerLayout: null,
      }),
    );

    const formLayout = FormLayoutFactory.create({
      appId: newApp.appId,
      rows: layoutRows,
    });

    // Create a default "All" list view with all field codes
    const fieldCodes = newFields.map((f) => f.fieldCode);
    const viewFields = fieldCodes.length > 0 ? fieldCodes : undefined;
    const newViews: View[] = [];

    if (viewFields !== undefined && viewFields.length > 0) {
      const { entity: defaultView } = ViewFactory.create({
        appId: newApp.appId,
        viewName: "(All)",
        viewType: "LIST",
        fields: viewFields,
        index: 0,
        builtinType: "ALL",
        pager: true,
      });
      newViews.push(defaultView);
    }

    return {
      app: newApp,
      fields: newFields,
      formLayout,
      views: newViews,
      reports: [],
    };
  }

  /**
   * Parse column headers from an Excel file.
   * Uses simple parsing to extract the first row as headers.
   * Supports XLSX format by looking for shared strings in the XML structure.
   */
  private parseExcelHeaders(file: ArrayBuffer): readonly string[] {
    try {
      // Simple XLSX parsing: XLSX files are ZIP archives containing XML files.
      // For basic header extraction, we look for shared string patterns in the binary.
      const bytes = new Uint8Array(file);
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

      // Try to find shared strings or inline strings in the XLSX XML
      // XLSX stores strings in a shared strings table (xl/sharedStrings.xml)
      // Format: <si><t>HeaderText</t></si>
      const sharedStringPattern = /<t[^>]*>([^<]+)<\/t>/g;
      const headers: string[] = [];
      let match: RegExpExecArray | null = null;

      // biome-ignore lint/suspicious/noAssignInExpressions: regex exec loop pattern
      while ((match = sharedStringPattern.exec(text)) !== null) {
        const value = match[1].trim();
        if (value.length > 0) {
          headers.push(this.decodeXmlEntities(value));
        }
      }

      // If no shared strings found, try to decode as CSV-like content
      if (headers.length === 0) {
        return this.parseCsvHeaders(file);
      }

      return headers;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.InternalServerError,
        "Failed to parse Excel file headers",
        error,
      );
    }
  }

  /**
   * Parse column headers from a CSV file.
   * Reads the first line and splits by comma.
   */
  private parseCsvHeaders(file: ArrayBuffer): readonly string[] {
    try {
      const text = new TextDecoder("utf-8").decode(file);
      const lines = text.split(/\r?\n/);
      const firstLine = lines[0];

      if (!firstLine || firstLine.trim().length === 0) {
        return [];
      }

      // Simple CSV parsing with support for quoted fields
      return this.parseCsvLine(firstLine);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.InternalServerError,
        "Failed to parse CSV file headers",
        error,
      );
    }
  }

  /**
   * Parse a single CSV line, handling quoted fields.
   */
  private parseCsvLine(line: string): readonly string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (inQuotes) {
        if (char === '"') {
          // Check for escaped quote (double quote)
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++; // Skip the next quote
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }

    // Add the last field
    result.push(current.trim());

    return result.filter((h) => h.length > 0);
  }

  /**
   * Decode basic XML entities.
   */
  private decodeXmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  // ============================================
  // Database query helpers
  // ============================================

  private async fetchApp(appId: AppId): Promise<App | null> {
    try {
      const results = await this.db
        .select()
        .from(apps)
        .where(eq(apps.id, appId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const r = results[0];
      return {
        appId: r.id as App["appId"],
        code: r.code !== null ? (r.code as App["code"]) : null,
        name: r.name as App["name"],
        description: r.description,
        spaceId: r.spaceId !== null ? (r.spaceId as App["spaceId"]) : null,
        threadId: r.threadId !== null ? (r.threadId as App["threadId"]) : null,
        theme: r.theme as App["theme"],
        icon: r.icon as unknown as App["icon"],
        titleField: r.titleFieldConfig as unknown as App["titleField"],
        enableThumbnails: r.enableThumbnails,
        enableBulkDeletion: r.enableBulkDeletion,
        enableRecordHistory: r.enableRecordHistory,
        enableComments: r.enableComments,
        enableDuplicateRecord: r.enableDuplicateRecord,
        enableInlineEditing: r.enableInlineEditing,
        numberPrecision: r.numberPrecision as unknown as App["numberPrecision"],
        firstMonthOfFiscalYear: r.firstMonthOfFiscalYear,
        revision: r.revision as App["revision"],
        status: r.status as App["status"],
        creatorId: r.creatorId as App["creatorId"],
        modifierId: r.modifierId as App["modifierId"],
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch source app",
        error,
      );
    }
  }

  private async fetchFields(appId: AppId): Promise<readonly Field[]> {
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
        "Failed to fetch source fields",
        error,
      );
    }
  }

  private async fetchFormLayout(appId: AppId): Promise<FormLayout | null> {
    try {
      const results = await this.db
        .select()
        .from(formLayouts)
        .where(eq(formLayouts.appId, appId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const r = results[0];
      return {
        appId: r.appId as FormLayout["appId"],
        rows: r.rows as unknown as FormLayout["rows"],
        revision: r.revision as FormLayout["revision"],
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch source form layout",
        error,
      );
    }
  }

  private async fetchViews(appId: AppId): Promise<readonly View[]> {
    try {
      const results = await this.db
        .select()
        .from(views)
        .where(eq(views.appId, appId));

      return results.map((r) => ({
        viewId: r.id as View["viewId"],
        appId: r.appId as View["appId"],
        viewName: r.viewName,
        viewType: r.viewType as View["viewType"],
        fields: r.fields as unknown as View["fields"],
        calendarDateField:
          r.calendarDateField !== null
            ? (r.calendarDateField as View["calendarDateField"])
            : null,
        calendarTitleField:
          r.calendarTitleField !== null
            ? (r.calendarTitleField as View["calendarTitleField"])
            : null,
        html: r.html,
        pager: r.pager,
        deviceScope:
          r.deviceScope !== null
            ? (r.deviceScope as View["deviceScope"])
            : null,
        filterCondition: r.filterCondition,
        sort: r.sort as unknown as View["sort"],
        index: r.index,
        builtinType:
          r.builtinType !== null
            ? (r.builtinType as View["builtinType"])
            : null,
      }));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch source views",
        error,
      );
    }
  }

  private async fetchReports(appId: AppId): Promise<readonly Report[]> {
    try {
      const results = await this.db
        .select()
        .from(reports)
        .where(eq(reports.appId, appId));

      return results.map((r) => ({
        reportId: r.id as Report["reportId"],
        appId: r.appId as Report["appId"],
        reportName: r.reportName,
        chartType: r.chartType as Report["chartType"],
        chartSubType:
          r.chartSubType !== null
            ? (r.chartSubType as Report["chartSubType"])
            : null,
        groups: r.groups as unknown as Report["groups"],
        aggregations: r.aggregations as unknown as Report["aggregations"],
        filterCondition: r.filterCondition,
        sort: r.sort as unknown as Report["sort"],
        periodicReport:
          r.periodicReportConfig !== null
            ? (r.periodicReportConfig as unknown as Report["periodicReport"])
            : null,
      }));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch source reports",
        error,
      );
    }
  }
}
