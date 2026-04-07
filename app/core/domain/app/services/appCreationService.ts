import type { App, Field, FormLayout, Report, View } from "../entity";
import type { AppId, SpaceId } from "../valueObject";

/**
 * Domain service for creating apps from various sources.
 *
 * Handles the complex creation logic including field generation
 * from templates, Excel/CSV files, and app duplication.
 */

export type AppCreationResult = {
  app: App;
  fields: readonly Field[];
  formLayout: FormLayout | null;
  views: readonly View[];
  reports: readonly Report[];
};

export interface AppCreationService {
  /**
   * Create an app from a template, copying all configuration.
   */
  createFromTemplate(
    templateId: AppId,
    name: string,
    spaceId: SpaceId | null,
  ): Promise<AppCreationResult>;

  /**
   * Create an app from an Excel file, generating fields from headers.
   */
  createFromExcel(
    file: ArrayBuffer,
    name: string,
    spaceId: SpaceId | null,
  ): Promise<AppCreationResult>;

  /**
   * Create an app from a CSV file, generating fields from headers.
   */
  createFromCsv(
    file: ArrayBuffer,
    name: string,
    spaceId: SpaceId | null,
  ): Promise<AppCreationResult>;

  /**
   * Duplicate an existing app's configuration (without record data).
   */
  duplicateApp(
    sourceAppId: AppId,
    name: string,
    spaceId: SpaceId | null,
  ): Promise<AppCreationResult>;
}
