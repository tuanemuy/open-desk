import type {
  ApiScope,
  CategoryNode,
  ChartType,
  CustomizationScope,
  FieldType,
  PeriodicReportConfig,
  ProcessStatus,
  ProcessTransition,
  ViewType,
  WebhookEvent,
} from "@/core/domain/app/valueObject";

// ============================================
// App Lifecycle DTOs
// ============================================

export type CreateAppOutput = {
  appId: string;
  name: string;
  status: "PREVIEW";
  revision: number;
  createdAt: Date;
};

export type CreateAppFromFileOutput = {
  appId: string;
  name: string;
  status: "PREVIEW";
  fieldCount: number;
  revision: number;
  createdAt: Date;
};

export type UpdateAppSettingsOutput = {
  appId: string;
  revision: number;
  updatedAt: Date;
};

export type DeployResultItem = {
  appId: string;
  status: "PROCESSING" | "SUCCESS" | "FAIL" | "CANCEL";
};

export type DeployAppsOutput = {
  results: DeployResultItem[];
};

export type RevertAppOutput = {
  appId: string;
  revision: number;
};

export type DeleteAppOutput = {
  appId: string;
  status: "DELETED";
  deletedAt: Date;
};

export type RestoreAppOutput = {
  appId: string;
  status: "ACTIVE";
  restoredAt: Date;
};

// ============================================
// Field DTOs
// ============================================

export type AddFieldOutput = {
  fieldId: string;
  fieldCode: string;
  label: string;
  fieldType: FieldType;
};

export type UpdateFieldOutput = {
  fieldId: string;
  fieldCode: string;
  label: string;
  fieldType: FieldType;
  updatedAt: Date;
};

export type DeleteFieldOutput = {
  deletedFieldIds: string[];
};

export type UpdateFormLayoutOutput = {
  appId: string;
  revision: number;
};

// ============================================
// View DTOs
// ============================================

export type CreateViewOutput = {
  viewId: string;
  viewName: string;
  viewType: ViewType;
  index: number;
};

export type UpdateViewOutput = {
  viewId: string;
  viewName: string;
  viewType: ViewType;
  index: number;
  updatedAt: Date;
};

export type DeleteViewOutput = {
  viewId: string;
};

// ============================================
// Report DTOs
// ============================================

export type CreateReportOutput = {
  reportId: string;
  reportName: string;
  chartType: ChartType;
};

export type UpdateReportOutput = {
  reportId: string;
  reportName: string;
  chartType: ChartType;
  updatedAt: Date;
};

export type DeleteReportOutput = {
  reportId: string;
};

export type EnablePeriodicReportOutput = {
  reportId: string;
  isSettingsLocked: boolean;
  periodicReport: PeriodicReportConfig;
};

export type DisablePeriodicReportOutput = {
  reportId: string;
  isSettingsLocked: boolean;
};

// ============================================
// Process Definition DTOs
// ============================================

export type ConfigureProcessOutput = {
  appId: string;
  isEnabled: boolean;
  statuses: ProcessStatus[];
  transitions: ProcessTransition[];
  revision: number;
};

// ============================================
// Webhook DTOs
// ============================================

export type ConfigureWebhookOutput = {
  webhookId: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
};

// ============================================
// API Token DTOs
// ============================================

export type ManageApiTokenOutput = {
  tokenId: string;
  token: string | null;
  scopes: ApiScope[];
  memo: string;
};

// ============================================
// Notification DTOs
// ============================================

export type ConfigureNotificationsOutput = {
  appId: string;
  revision: number;
};

// ============================================
// Customization DTOs
// ============================================

export type ManageCustomizationOutput = {
  appId: string;
  scope: CustomizationScope;
  revision: number;
};

// ============================================
// Action DTOs
// ============================================

export type ConfigureActionOutput = {
  actionId: string;
  actionName: string;
  destinationAppId: string;
};

// ============================================
// Category DTOs
// ============================================

export type ConfigureCategoriesOutput = {
  appId: string;
  isEnabled: boolean;
  categories: CategoryNode[];
  revision: number;
};

// ============================================
// I18n DTOs
// ============================================

export type ConfigureI18nOutput = {
  appId: string;
  translationCount: number;
  revision: number;
};

// ============================================
// App Template DTOs
// ============================================

export type AppTemplateDto = {
  templateId: string;
  name: string;
  description: string | null;
  sourceAppId: string | null;
  creatorId: string;
  createdAt: Date;
};

export type AppTemplateListOutput = {
  templates: readonly AppTemplateDto[];
  totalCount: number;
};

export type ExportAppTemplateOutput = {
  file: ArrayBuffer;
  fileName: string;
};

// ============================================
// App Group DTOs
// ============================================

export type AppGroupDto = {
  appGroupId: string;
  name: string;
  isDefault: boolean;
  appIds: readonly string[];
  createdAt: Date;
  updatedAt: Date;
};

export type AppGroupListOutput = {
  groups: readonly AppGroupDto[];
  totalCount: number;
};

// ============================================
// Plugin DTOs
// ============================================

export type PluginDto = {
  pluginId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isPreinstalled: boolean;
  installedAppIds: readonly string[];
  createdAt: Date;
  updatedAt: Date;
};

export type PluginListOutput = {
  plugins: readonly PluginDto[];
  totalCount: number;
};
