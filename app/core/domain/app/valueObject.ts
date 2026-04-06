import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { AppErrorCode } from "./errorCode";

// ============================================
// AppId
// ============================================

type _AppId = string & { readonly brand: "AppId" };

export type AppId = _AppId;

export const AppId = {
  create: (id: string): _AppId => {
    return id as _AppId;
  },
  generate: (): _AppId => {
    return uuidv7() as _AppId;
  },
};

// ============================================
// FieldId
// ============================================

type _FieldId = string & { readonly brand: "FieldId" };

export type FieldId = _FieldId;

export const FieldId = {
  create: (id: string): _FieldId => {
    return id as _FieldId;
  },
  generate: (): _FieldId => {
    return uuidv7() as _FieldId;
  },
};

// ============================================
// ViewId
// ============================================

type _ViewId = string & { readonly brand: "ViewId" };

export type ViewId = _ViewId;

export const ViewId = {
  create: (id: string): _ViewId => {
    return id as _ViewId;
  },
  generate: (): _ViewId => {
    return uuidv7() as _ViewId;
  },
};

// ============================================
// ReportId
// ============================================

type _ReportId = string & { readonly brand: "ReportId" };

export type ReportId = _ReportId;

export const ReportId = {
  create: (id: string): _ReportId => {
    return id as _ReportId;
  },
  generate: (): _ReportId => {
    return uuidv7() as _ReportId;
  },
};

// ============================================
// WebhookId
// ============================================

type _WebhookId = string & { readonly brand: "WebhookId" };

export type WebhookId = _WebhookId;

export const WebhookId = {
  create: (id: string): _WebhookId => {
    return id as _WebhookId;
  },
  generate: (): _WebhookId => {
    return uuidv7() as _WebhookId;
  },
};

// ============================================
// ApiTokenId
// ============================================

type _ApiTokenId = string & { readonly brand: "ApiTokenId" };

export type ApiTokenId = _ApiTokenId;

export const ApiTokenId = {
  create: (id: string): _ApiTokenId => {
    return id as _ApiTokenId;
  },
  generate: (): _ApiTokenId => {
    return uuidv7() as _ApiTokenId;
  },
};

// ============================================
// AppActionId
// ============================================

type _AppActionId = string & { readonly brand: "AppActionId" };

export type AppActionId = _AppActionId;

export const AppActionId = {
  create: (id: string): _AppActionId => {
    return id as _AppActionId;
  },
  generate: (): _AppActionId => {
    return uuidv7() as _AppActionId;
  },
};

// ============================================
// ProcessStatusId
// ============================================

type _ProcessStatusId = string & { readonly brand: "ProcessStatusId" };

export type ProcessStatusId = _ProcessStatusId;

export const ProcessStatusId = {
  create: (id: string): _ProcessStatusId => {
    return id as _ProcessStatusId;
  },
  generate: (): _ProcessStatusId => {
    return uuidv7() as _ProcessStatusId;
  },
};

// ============================================
// ProcessTransitionId
// ============================================

type _ProcessTransitionId = string & {
  readonly brand: "ProcessTransitionId";
};

export type ProcessTransitionId = _ProcessTransitionId;

export const ProcessTransitionId = {
  create: (id: string): _ProcessTransitionId => {
    return id as _ProcessTransitionId;
  },
  generate: (): _ProcessTransitionId => {
    return uuidv7() as _ProcessTransitionId;
  },
};

// ============================================
// CategoryId
// ============================================

type _CategoryId = string & { readonly brand: "CategoryId" };

export type CategoryId = _CategoryId;

export const CategoryId = {
  create: (id: string): _CategoryId => {
    return id as _CategoryId;
  },
  generate: (): _CategoryId => {
    return uuidv7() as _CategoryId;
  },
};

// ============================================
// PluginId
// ============================================

type _PluginId = string & { readonly brand: "PluginId" };

export type PluginId = _PluginId;

export const PluginId = {
  create: (id: string): _PluginId => {
    return id as _PluginId;
  },
  generate: (): _PluginId => {
    return uuidv7() as _PluginId;
  },
};

// ============================================
// AppName
// ============================================

const APP_NAME_MAX_LENGTH = 64;

type _AppName = string & { readonly brand: "AppName" };

export type AppName = _AppName;

export const AppName = {
  create: (value: string): _AppName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyAppName,
        "App name cannot be empty",
      );
    }
    if (value.length > APP_NAME_MAX_LENGTH) {
      throw new BusinessRuleError(
        AppErrorCode.AppNameTooLong,
        `App name exceeds maximum length of ${APP_NAME_MAX_LENGTH} characters`,
      );
    }
    return value as _AppName;
  },
  maxLength: APP_NAME_MAX_LENGTH,
};

// ============================================
// AppCode
// ============================================

const APP_CODE_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*$/;

type _AppCode = string & { readonly brand: "AppCode" };

export type AppCode = _AppCode;

export const AppCode = {
  create: (value: string): _AppCode => {
    if (!APP_CODE_PATTERN.test(value)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidAppCode,
        "App code must start with a letter and contain only alphanumeric characters",
      );
    }
    return value as _AppCode;
  },
  pattern: APP_CODE_PATTERN,
};

// ============================================
// FieldCode
// ============================================

type _FieldCode = string & { readonly brand: "FieldCode" };

export type FieldCode = _FieldCode;

export const FieldCode = {
  create: (value: string): _FieldCode => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyFieldCode,
        "Field code cannot be empty",
      );
    }
    return value as _FieldCode;
  },
};

// ============================================
// Revision
// ============================================

type _Revision = number & { readonly brand: "Revision" };

export type Revision = _Revision;

export const Revision = {
  create: (value: number): _Revision => {
    if (!Number.isInteger(value) || value < 0) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidRevision,
        "Revision must be a non-negative integer",
      );
    }
    return value as _Revision;
  },
  initial: (): _Revision => {
    return 0 as _Revision;
  },
  increment: (revision: _Revision): _Revision => {
    return (revision + 1) as _Revision;
  },
};

// ============================================
// AppStatus
// ============================================

const APP_STATUSES = ["PREVIEW", "ACTIVE", "DELETED"] as const;

type _AppStatus = (typeof APP_STATUSES)[number];

export type AppStatus = _AppStatus;

export const AppStatus = {
  Preview: "PREVIEW" as _AppStatus,
  Active: "ACTIVE" as _AppStatus,
  Deleted: "DELETED" as _AppStatus,
  create: (value: string): _AppStatus => {
    if (!APP_STATUSES.includes(value as _AppStatus)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidAppStatus,
        `Invalid app status: ${value}`,
      );
    }
    return value as _AppStatus;
  },
  isPreview: (status: _AppStatus): status is "PREVIEW" => status === "PREVIEW",
  isActive: (status: _AppStatus): status is "ACTIVE" => status === "ACTIVE",
  isDeleted: (status: _AppStatus): status is "DELETED" => status === "DELETED",
};

// ============================================
// AppTheme
// ============================================

const APP_THEMES = [
  "WHITE",
  "RED",
  "GREEN",
  "BLUE",
  "YELLOW",
  "BLACK",
] as const;

type _AppTheme = (typeof APP_THEMES)[number];

export type AppTheme = _AppTheme;

export const AppTheme = {
  White: "WHITE" as _AppTheme,
  Red: "RED" as _AppTheme,
  Green: "GREEN" as _AppTheme,
  Blue: "BLUE" as _AppTheme,
  Yellow: "YELLOW" as _AppTheme,
  Black: "BLACK" as _AppTheme,
  create: (value: string): _AppTheme => {
    if (!APP_THEMES.includes(value as _AppTheme)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidAppTheme,
        `Invalid app theme: ${value}`,
      );
    }
    return value as _AppTheme;
  },
  validValues: APP_THEMES,
};

// ============================================
// AppIcon
// ============================================

const APP_ICON_TYPES = ["PRESET", "FILE"] as const;

type _AppIconType = (typeof APP_ICON_TYPES)[number];

type _AppIcon = Readonly<{
  type: _AppIconType;
  key: string | null;
  fileKey: string | null;
}>;

export type AppIcon = _AppIcon;

export const AppIcon = {
  createPreset: (key: string): _AppIcon => ({
    type: "PRESET",
    key,
    fileKey: null,
  }),
  createFile: (fileKey: string): _AppIcon => ({
    type: "FILE",
    key: null,
    fileKey,
  }),
  default: (): _AppIcon => ({
    type: "PRESET",
    key: "default",
    fileKey: null,
  }),
};

// ============================================
// TitleFieldConfig
// ============================================

const TITLE_FIELD_SELECTION_MODES = ["AUTO", "MANUAL"] as const;

type _TitleFieldSelectionMode = (typeof TITLE_FIELD_SELECTION_MODES)[number];

export type TitleFieldSelectionMode = _TitleFieldSelectionMode;

type _TitleFieldConfig = Readonly<{
  selectionMode: _TitleFieldSelectionMode;
  fieldCode: _FieldCode | null;
}>;

export type TitleFieldConfig = _TitleFieldConfig;

export const TitleFieldConfig = {
  auto: (): _TitleFieldConfig => ({
    selectionMode: "AUTO",
    fieldCode: null,
  }),
  manual: (fieldCode: _FieldCode): _TitleFieldConfig => ({
    selectionMode: "MANUAL",
    fieldCode,
  }),
};

// ============================================
// NumberPrecision
// ============================================

const NUMBER_PRECISION_DIGITS_MIN = 1;
const NUMBER_PRECISION_DIGITS_MAX = 30;
const NUMBER_PRECISION_DECIMAL_MIN = 0;
const NUMBER_PRECISION_DECIMAL_MAX = 10;

const ROUNDING_MODES = ["HALF_EVEN", "UP", "DOWN"] as const;

type _RoundingMode = (typeof ROUNDING_MODES)[number];

export type RoundingMode = _RoundingMode;

type _NumberPrecision = Readonly<{
  digits: number;
  decimalPlaces: number;
  roundingMode: _RoundingMode;
}>;

export type NumberPrecision = _NumberPrecision;

export const NumberPrecision = {
  create: (params: {
    digits: number;
    decimalPlaces: number;
    roundingMode: _RoundingMode;
  }): _NumberPrecision => {
    if (
      params.digits < NUMBER_PRECISION_DIGITS_MIN ||
      params.digits > NUMBER_PRECISION_DIGITS_MAX
    ) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidDigits,
        `Digits must be between ${NUMBER_PRECISION_DIGITS_MIN} and ${NUMBER_PRECISION_DIGITS_MAX}`,
      );
    }
    if (
      params.decimalPlaces < NUMBER_PRECISION_DECIMAL_MIN ||
      params.decimalPlaces > NUMBER_PRECISION_DECIMAL_MAX
    ) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidDecimalPlaces,
        `Decimal places must be between ${NUMBER_PRECISION_DECIMAL_MIN} and ${NUMBER_PRECISION_DECIMAL_MAX}`,
      );
    }
    if (params.decimalPlaces > params.digits) {
      throw new BusinessRuleError(
        AppErrorCode.DecimalPlacesExceedsDigits,
        "Decimal places cannot exceed total digits",
      );
    }
    if (!ROUNDING_MODES.includes(params.roundingMode)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidRoundingMode,
        `Invalid rounding mode: ${params.roundingMode}`,
      );
    }
    return {
      digits: params.digits,
      decimalPlaces: params.decimalPlaces,
      roundingMode: params.roundingMode,
    };
  },
  default: (): _NumberPrecision => ({
    digits: 30,
    decimalPlaces: 4,
    roundingMode: "HALF_EVEN",
  }),
};

// ============================================
// AppFeatureFlags
// ============================================

type _AppFeatureFlags = Readonly<{
  enableThumbnails?: boolean;
  enableBulkDeletion?: boolean;
  enableRecordHistory?: boolean;
  enableComments?: boolean;
  enableDuplicateRecord?: boolean;
  enableInlineEditing?: boolean;
}>;

export type AppFeatureFlags = _AppFeatureFlags;

// ============================================
// FieldType
// ============================================

const FIELD_TYPES = [
  "SINGLE_LINE_TEXT",
  "MULTI_LINE_TEXT",
  "RICH_TEXT",
  "NUMBER",
  "CALC",
  "RADIO_BUTTON",
  "CHECK_BOX",
  "MULTI_SELECT",
  "DROP_DOWN",
  "DATE",
  "TIME",
  "DATETIME",
  "FILE",
  "LINK",
  "USER_SELECT",
  "ORGANIZATION_SELECT",
  "GROUP_SELECT",
  "LOOKUP",
  "REFERENCE_TABLE",
  "LABEL",
  "SPACER",
  "HR",
  "GROUP",
  "SUBTABLE",
  "RECORD_NUMBER",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME",
  "STATUS",
  "STATUS_ASSIGNEE",
  "CATEGORY",
] as const;

type _FieldType = (typeof FIELD_TYPES)[number];

export type FieldType = _FieldType;

const SYSTEM_FIELD_TYPES: readonly _FieldType[] = [
  "RECORD_NUMBER",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME",
];

const FIELDS_NOT_ALLOWED_IN_SUBTABLE: readonly _FieldType[] = [
  "SUBTABLE",
  "GROUP",
  "REFERENCE_TABLE",
  "RECORD_NUMBER",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME",
  "STATUS",
  "STATUS_ASSIGNEE",
  "CATEGORY",
];

const FIELDS_NOT_ALLOWED_REQUIRED: readonly _FieldType[] = [
  "RADIO_BUTTON",
  "CALC",
  "RECORD_NUMBER",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME",
  "STATUS",
  "STATUS_ASSIGNEE",
  "CATEGORY",
  "LABEL",
  "SPACER",
  "HR",
  "GROUP",
  "SUBTABLE",
  "REFERENCE_TABLE",
];

const FIELDS_ALLOWED_UNIQUE: readonly _FieldType[] = [
  "SINGLE_LINE_TEXT",
  "NUMBER",
  "DATE",
  "DATETIME",
  "LINK",
];

export const FieldType = {
  create: (value: string): _FieldType => {
    if (!FIELD_TYPES.includes(value as _FieldType)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidFieldType,
        `Invalid field type: ${value}`,
      );
    }
    return value as _FieldType;
  },
  isSystemField: (fieldType: _FieldType): boolean =>
    SYSTEM_FIELD_TYPES.includes(fieldType),
  canBeInSubtable: (fieldType: _FieldType): boolean =>
    !FIELDS_NOT_ALLOWED_IN_SUBTABLE.includes(fieldType),
  canBeRequired: (fieldType: _FieldType): boolean =>
    !FIELDS_NOT_ALLOWED_REQUIRED.includes(fieldType),
  canBeUnique: (fieldType: _FieldType): boolean =>
    FIELDS_ALLOWED_UNIQUE.includes(fieldType),
  validValues: FIELD_TYPES,
};

// ============================================
// ViewType
// ============================================

const VIEW_TYPES = ["LIST", "CALENDAR", "CUSTOM"] as const;

type _ViewType = (typeof VIEW_TYPES)[number];

export type ViewType = _ViewType;

export const ViewType = {
  List: "LIST" as _ViewType,
  Calendar: "CALENDAR" as _ViewType,
  Custom: "CUSTOM" as _ViewType,
  create: (value: string): _ViewType => {
    if (!VIEW_TYPES.includes(value as _ViewType)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidViewType,
        `Invalid view type: ${value}`,
      );
    }
    return value as _ViewType;
  },
};

// ============================================
// BuiltinViewType
// ============================================

const BUILTIN_VIEW_TYPES = ["ASSIGNEE", "ALL"] as const;

type _BuiltinViewType = (typeof BUILTIN_VIEW_TYPES)[number];

export type BuiltinViewType = _BuiltinViewType;

// ============================================
// DeviceScope
// ============================================

const DEVICE_SCOPES = ["PC_AND_MOBILE", "PC_ONLY"] as const;

type _DeviceScope = (typeof DEVICE_SCOPES)[number];

export type DeviceScope = _DeviceScope;

// ============================================
// ChartType
// ============================================

const CHART_TYPES = [
  "BAR",
  "COLUMN",
  "PIE",
  "LINE",
  "PIVOT_TABLE",
  "TABLE",
  "AREA",
  "SPLINE",
  "SPLINE_AREA",
] as const;

type _ChartType = (typeof CHART_TYPES)[number];

export type ChartType = _ChartType;

export const ChartType = {
  create: (value: string): _ChartType => {
    if (!CHART_TYPES.includes(value as _ChartType)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidChartType,
        `Invalid chart type: ${value}`,
      );
    }
    return value as _ChartType;
  },
  validValues: CHART_TYPES,
};

// ============================================
// ChartSubType
// ============================================

const CHART_SUB_TYPES = ["NORMAL", "STACKED", "PERCENTAGE"] as const;

type _ChartSubType = (typeof CHART_SUB_TYPES)[number];

export type ChartSubType = _ChartSubType;

export const ChartSubType = {
  create: (value: string): _ChartSubType => {
    if (!CHART_SUB_TYPES.includes(value as _ChartSubType)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidChartSubType,
        `Invalid chart sub type: ${value}`,
      );
    }
    return value as _ChartSubType;
  },
};

// ============================================
// WebhookEvent
// ============================================

const WEBHOOK_EVENTS = [
  "ADD_RECORD",
  "UPDATE_RECORD",
  "DELETE_RECORD",
  "UPDATE_STATUS",
  "ADD_RECORD_COMMENT",
] as const;

type _WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type WebhookEvent = _WebhookEvent;

export const WebhookEvent = {
  create: (value: string): _WebhookEvent => {
    if (!WEBHOOK_EVENTS.includes(value as _WebhookEvent)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidWebhookEvent,
        `Invalid webhook event: ${value}`,
      );
    }
    return value as _WebhookEvent;
  },
  validValues: WEBHOOK_EVENTS,
};

// ============================================
// ApiScope
// ============================================

const API_SCOPES = ["READ", "WRITE", "UPDATE", "DELETE", "MANAGE_APP"] as const;

type _ApiScope = (typeof API_SCOPES)[number];

export type ApiScope = _ApiScope;

export const ApiScope = {
  create: (value: string): _ApiScope => {
    if (!API_SCOPES.includes(value as _ApiScope)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidApiScope,
        `Invalid API scope: ${value}`,
      );
    }
    return value as _ApiScope;
  },
  validValues: API_SCOPES,
};

// ============================================
// WebhookUrl
// ============================================

type _WebhookUrl = string & { readonly brand: "WebhookUrl" };

export type WebhookUrl = _WebhookUrl;

export const WebhookUrl = {
  create: (value: string): _WebhookUrl => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidWebhookUrl,
        "Webhook URL cannot be empty",
      );
    }
    if (!value.startsWith("https://")) {
      throw new BusinessRuleError(
        AppErrorCode.WebhookUrlNotHttps,
        "Webhook URL must use HTTPS",
      );
    }
    return value as _WebhookUrl;
  },
};

// ============================================
// SortSpec
// ============================================

const SORT_ORDERS = ["ASC", "DESC"] as const;

type _SortOrder = (typeof SORT_ORDERS)[number];

export type SortOrder = _SortOrder;

type _SortSpec = Readonly<{
  fieldCode: _FieldCode;
  order: _SortOrder;
}>;

export type SortSpec = _SortSpec;

export const SortSpec = {
  create: (fieldCode: _FieldCode, order: _SortOrder): _SortSpec => ({
    fieldCode,
    order,
  }),
};

// ============================================
// ReportSortSpec
// ============================================

const REPORT_SORT_BY = ["TOTAL", "GROUP1", "GROUP2", "GROUP3"] as const;

type _ReportSortBy = (typeof REPORT_SORT_BY)[number];

export type ReportSortBy = _ReportSortBy;

type _ReportSortSpec = Readonly<{
  by: _ReportSortBy;
  order: _SortOrder;
}>;

export type ReportSortSpec = _ReportSortSpec;

export const ReportSortSpec = {
  create: (by: _ReportSortBy, order: _SortOrder): _ReportSortSpec => ({
    by,
    order,
  }),
};

// ============================================
// ReportGroup
// ============================================

const REPORT_TIME_UNITS = [
  "YEAR",
  "QUARTER",
  "MONTH",
  "WEEK",
  "DAY",
  "HOUR",
  "MINUTE",
] as const;

type _ReportTimeUnit = (typeof REPORT_TIME_UNITS)[number];

export type ReportTimeUnit = _ReportTimeUnit;

type _ReportGroup = Readonly<{
  fieldCode: _FieldCode;
  timeUnit: _ReportTimeUnit | null;
}>;

export type ReportGroup = _ReportGroup;

export const ReportGroup = {
  create: (
    fieldCode: _FieldCode,
    timeUnit: _ReportTimeUnit | null,
  ): _ReportGroup => ({
    fieldCode,
    timeUnit,
  }),
};

// ============================================
// ReportAggregation
// ============================================

const AGGREGATION_METHODS = ["COUNT", "SUM", "AVERAGE", "MAX", "MIN"] as const;

type _AggregationMethod = (typeof AGGREGATION_METHODS)[number];

export type AggregationMethod = _AggregationMethod;

type _ReportAggregation = Readonly<{
  fieldCode: _FieldCode | null;
  method: _AggregationMethod;
}>;

export type ReportAggregation = _ReportAggregation;

export const ReportAggregation = {
  create: (
    fieldCode: _FieldCode | null,
    method: _AggregationMethod,
  ): _ReportAggregation => ({
    fieldCode,
    method,
  }),
};

// ============================================
// PeriodicReportConfig
// ============================================

const PERIODIC_INTERVALS = [
  "YEARLY",
  "QUARTERLY",
  "MONTHLY",
  "WEEKLY",
  "DAILY",
  "HOURLY",
] as const;

type _PeriodicInterval = (typeof PERIODIC_INTERVALS)[number];

export type PeriodicInterval = _PeriodicInterval;

export const PeriodicInterval = {
  create: (value: string): _PeriodicInterval => {
    if (!PERIODIC_INTERVALS.includes(value as _PeriodicInterval)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidPeriodicInterval,
        `Invalid periodic interval: ${value}`,
      );
    }
    return value as _PeriodicInterval;
  },
  validValues: PERIODIC_INTERVALS,
};

type _PeriodicReportConfig = Readonly<{
  interval: _PeriodicInterval;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  quarterMonth: number | null;
  hourMinute: Readonly<{ hour: number; minute: number }> | null;
  minuteOfHour: number | null;
  timezone: string;
  isRunning: boolean;
}>;

export type PeriodicReportConfig = _PeriodicReportConfig;

export const PeriodicReportConfig = {
  create: (params: {
    interval: _PeriodicInterval;
    dayOfMonth: number | null;
    dayOfWeek: number | null;
    quarterMonth: number | null;
    hourMinute: Readonly<{ hour: number; minute: number }> | null;
    minuteOfHour: number | null;
    timezone: string;
    isRunning: boolean;
  }): _PeriodicReportConfig => ({
    interval: params.interval,
    dayOfMonth: params.dayOfMonth,
    dayOfWeek: params.dayOfWeek,
    quarterMonth: params.quarterMonth,
    hourMinute: params.hourMinute,
    minuteOfHour: params.minuteOfHour,
    timezone: params.timezone,
    isRunning: params.isRunning,
  }),
};

// ============================================
// ProcessStatus (value object in ProcessDefinition)
// ============================================

type _ProcessStatus = Readonly<{
  statusId: _ProcessStatusId;
  name: string;
  index: number;
}>;

export type ProcessStatus = _ProcessStatus;

export const ProcessStatus = {
  create: (params: {
    statusId: _ProcessStatusId;
    name: string;
    index: number;
  }): _ProcessStatus => {
    if (params.name.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyStatusName,
        "Process status name cannot be empty",
      );
    }
    return {
      statusId: params.statusId,
      name: params.name,
      index: params.index,
    };
  },
};

// ============================================
// WorkerAssignment
// ============================================

const WORKER_ENTITY_TYPES = [
  "USER",
  "ORGANIZATION",
  "GROUP",
  "FIELD_ENTITY",
  "CREATOR",
] as const;

type _WorkerEntityType = (typeof WORKER_ENTITY_TYPES)[number];

export type WorkerEntityType = _WorkerEntityType;

type _WorkerAssignment = Readonly<{
  entityType: _WorkerEntityType;
  entityCode: string | null;
  fieldCode: _FieldCode | null;
  includeSubs: boolean;
}>;

export type WorkerAssignment = _WorkerAssignment;

export const WorkerAssignment = {
  create: (params: {
    entityType: _WorkerEntityType;
    entityCode: string | null;
    fieldCode: _FieldCode | null;
    includeSubs: boolean;
  }): _WorkerAssignment => ({
    entityType: params.entityType,
    entityCode: params.entityCode,
    fieldCode: params.fieldCode,
    includeSubs: params.includeSubs,
  }),
};

// ============================================
// ProcessTransition
// ============================================

type _ProcessTransition = Readonly<{
  transitionId: _ProcessTransitionId;
  fromStatusId: _ProcessStatusId;
  actionName: string;
  toStatusId: _ProcessStatusId;
  workers: readonly _WorkerAssignment[];
  filterCondition: string | null;
  filterConditionType: "AND" | "OR" | null;
}>;

export type ProcessTransition = _ProcessTransition;

export const ProcessTransition = {
  create: (params: {
    transitionId: _ProcessTransitionId;
    fromStatusId: _ProcessStatusId;
    actionName: string;
    toStatusId: _ProcessStatusId;
    workers: readonly _WorkerAssignment[];
    filterCondition: string | null;
    filterConditionType: "AND" | "OR" | null;
  }): _ProcessTransition => ({
    transitionId: params.transitionId,
    fromStatusId: params.fromStatusId,
    actionName: params.actionName,
    toStatusId: params.toStatusId,
    workers: params.workers,
    filterCondition: params.filterCondition,
    filterConditionType: params.filterConditionType,
  }),
};

// ============================================
// ProcessTransitionInput
// ============================================

type _ProcessTransitionInput = Readonly<{
  fromStatusId: _ProcessStatusId;
  actionName: string;
  toStatusId: _ProcessStatusId;
  workers: readonly _WorkerAssignment[];
  filterCondition: string | null;
  filterConditionType: "AND" | "OR" | null;
}>;

export type ProcessTransitionInput = _ProcessTransitionInput;

// ============================================
// FieldSize
// ============================================

type _FieldSize = Readonly<{
  width: number | null;
  height: number | null;
  innerHeight: number | null;
}>;

export type FieldSize = _FieldSize;

export const FieldSize = {
  create: (params: {
    width: number | null;
    height: number | null;
    innerHeight: number | null;
  }): _FieldSize => ({
    width: params.width,
    height: params.height,
    innerHeight: params.innerHeight,
  }),
};

// ============================================
// LayoutPosition
// ============================================

type _LayoutPosition = Readonly<{
  rowIndex: number;
  fieldIndex: number;
}>;

export type LayoutPosition = _LayoutPosition;

export const LayoutPosition = {
  create: (rowIndex: number, fieldIndex: number): _LayoutPosition => {
    if (rowIndex < 0 || fieldIndex < 0) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidLayoutPosition,
        "Layout position indices must be non-negative",
      );
    }
    return { rowIndex, fieldIndex };
  },
};

// ============================================
// LayoutRowType
// ============================================

const LAYOUT_ROW_TYPES = ["ROW", "SUBTABLE", "GROUP"] as const;

type _LayoutRowType = (typeof LAYOUT_ROW_TYPES)[number];

export type LayoutRowType = _LayoutRowType;

export const LayoutRowType = {
  Row: "ROW" as _LayoutRowType,
  Subtable: "SUBTABLE" as _LayoutRowType,
  Group: "GROUP" as _LayoutRowType,
  create: (value: string): _LayoutRowType => {
    if (!LAYOUT_ROW_TYPES.includes(value as _LayoutRowType)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidLayoutRowType,
        `Invalid layout row type: ${value}`,
      );
    }
    return value as _LayoutRowType;
  },
};

// ============================================
// LayoutField
// ============================================

type _LayoutField = Readonly<{
  type: _FieldType;
  code: _FieldCode | null;
  label: string | null;
  elementId: string | null;
  size: _FieldSize;
}>;

export type LayoutField = _LayoutField;

export const LayoutField = {
  create: (params: {
    type: _FieldType;
    code: _FieldCode | null;
    label: string | null;
    elementId: string | null;
    size: _FieldSize;
  }): _LayoutField => ({
    type: params.type,
    code: params.code,
    label: params.label,
    elementId: params.elementId,
    size: params.size,
  }),
};

// ============================================
// LayoutRow
// ============================================

type _LayoutRow = Readonly<{
  type: _LayoutRowType;
  code: _FieldCode | null;
  fields: readonly _LayoutField[];
  innerLayout: readonly _LayoutRow[] | null;
}>;

export type LayoutRow = _LayoutRow;

export const LayoutRow = {
  create: (params: {
    type: _LayoutRowType;
    code: _FieldCode | null;
    fields: readonly _LayoutField[];
    innerLayout: readonly _LayoutRow[] | null;
  }): _LayoutRow => ({
    type: params.type,
    code: params.code,
    fields: params.fields,
    innerLayout: params.innerLayout,
  }),
};

// ============================================
// ValidationResult
// ============================================

type _ValidationError = Readonly<{
  fieldCode: _FieldCode;
  message: string;
  errorType:
    | "REQUIRED"
    | "UNIQUE"
    | "FORMAT"
    | "RANGE"
    | "LENGTH"
    | "TYPE_MISMATCH";
}>;

export type ValidationError = _ValidationError;

type _ValidationResult = Readonly<{
  isValid: boolean;
  errors: readonly _ValidationError[];
}>;

export type ValidationResult = _ValidationResult;

export const ValidationResult = {
  valid: (): _ValidationResult => ({
    isValid: true,
    errors: [],
  }),
  invalid: (errors: readonly _ValidationError[]): _ValidationResult => ({
    isValid: false,
    errors,
  }),
};

// ============================================
// FieldDefaultValue
// ============================================

type _FieldDefaultValue =
  | Readonly<{ type: "STRING"; value: string }>
  | Readonly<{ type: "STRING_LIST"; values: readonly string[] }>
  | Readonly<{ type: "NOW" }>
  | Readonly<{ type: "LOGIN_USER" }>;

export type FieldDefaultValue = _FieldDefaultValue;

export const FieldDefaultValue = {
  string: (value: string): _FieldDefaultValue => ({ type: "STRING", value }),
  stringList: (values: readonly string[]): _FieldDefaultValue => ({
    type: "STRING_LIST",
    values,
  }),
  now: (): _FieldDefaultValue => ({ type: "NOW" }),
  loginUser: (): _FieldDefaultValue => ({ type: "LOGIN_USER" }),
};

// ============================================
// SelectOption
// ============================================

type _SelectOption = Readonly<{
  label: string;
  index: number;
}>;

export type SelectOption = _SelectOption;

export const SelectOption = {
  create: (label: string, index: number): _SelectOption => ({
    label,
    index,
  }),
};

// ============================================
// OptionAlign
// ============================================

const OPTION_ALIGNS = ["HORIZONTAL", "VERTICAL"] as const;

type _OptionAlign = (typeof OPTION_ALIGNS)[number];

export type OptionAlign = _OptionAlign;

// ============================================
// CalcDisplayFormat
// ============================================

const CALC_DISPLAY_FORMATS = [
  "NUMBER",
  "NUMBER_DIGIT",
  "DATETIME",
  "DATE",
  "TIME",
  "HOUR_MINUTE",
  "DAY_HOUR_MINUTE",
] as const;

type _CalcDisplayFormat = (typeof CALC_DISPLAY_FORMATS)[number];

export type CalcDisplayFormat = _CalcDisplayFormat;

// ============================================
// LinkProtocol
// ============================================

const LINK_PROTOCOLS = ["WEB", "CALL", "MAIL"] as const;

type _LinkProtocol = (typeof LINK_PROTOCOLS)[number];

export type LinkProtocol = _LinkProtocol;

// ============================================
// FieldProperties (discriminated union)
// ============================================

type _SingleLineTextProperties = Readonly<{
  type: "SINGLE_LINE_TEXT";
  expression: string | null;
  hideExpression: boolean;
  minLength: number | null;
  maxLength: number | null;
}>;

export type SingleLineTextProperties = _SingleLineTextProperties;

type _MultiLineTextProperties = Readonly<{
  type: "MULTI_LINE_TEXT";
}>;

export type MultiLineTextProperties = _MultiLineTextProperties;

type _RichTextProperties = Readonly<{
  type: "RICH_TEXT";
}>;

export type RichTextProperties = _RichTextProperties;

type _NumberProperties = Readonly<{
  type: "NUMBER";
  digit: boolean;
  minValue: number | null;
  maxValue: number | null;
  displayScale: number | null;
  unit: string | null;
  unitPosition: "BEFORE" | "AFTER";
}>;

export type NumberProperties = _NumberProperties;

type _CalcProperties = Readonly<{
  type: "CALC";
  expression: string;
  hideExpression: boolean;
  format: _CalcDisplayFormat;
  displayScale: number | null;
  unit: string | null;
  unitPosition: "BEFORE" | "AFTER";
}>;

export type CalcProperties = _CalcProperties;

type _RadioButtonProperties = Readonly<{
  type: "RADIO_BUTTON";
  options: readonly _SelectOption[];
  align: _OptionAlign;
}>;

export type RadioButtonProperties = _RadioButtonProperties;

type _CheckBoxProperties = Readonly<{
  type: "CHECK_BOX";
  options: readonly _SelectOption[];
  align: _OptionAlign;
}>;

export type CheckBoxProperties = _CheckBoxProperties;

type _MultiSelectProperties = Readonly<{
  type: "MULTI_SELECT";
  options: readonly _SelectOption[];
}>;

export type MultiSelectProperties = _MultiSelectProperties;

type _DropDownProperties = Readonly<{
  type: "DROP_DOWN";
  options: readonly _SelectOption[];
}>;

export type DropDownProperties = _DropDownProperties;

type _DateProperties = Readonly<{
  type: "DATE";
  defaultNowValue: boolean;
}>;

export type DateProperties = _DateProperties;

type _TimeProperties = Readonly<{
  type: "TIME";
  defaultNowValue: boolean;
}>;

export type TimeProperties = _TimeProperties;

type _DateTimeProperties = Readonly<{
  type: "DATETIME";
  defaultNowValue: boolean;
}>;

export type DateTimeProperties = _DateTimeProperties;

type _FileProperties = Readonly<{
  type: "FILE";
  thumbnailSize: number;
}>;

export type FileProperties = _FileProperties;

type _LinkProperties = Readonly<{
  type: "LINK";
  protocol: _LinkProtocol;
  minLength: number | null;
  maxLength: number | null;
}>;

export type LinkProperties = _LinkProperties;

type _UserSelectEntity = Readonly<{
  type: "USER" | "ORGANIZATION" | "GROUP";
  code: string;
}>;

export type UserSelectEntity = _UserSelectEntity;

type _UserSelectProperties = Readonly<{
  type: "USER_SELECT";
  entities: readonly _UserSelectEntity[];
}>;

export type UserSelectProperties = _UserSelectProperties;

type _OrganizationSelectEntity = Readonly<{
  type: "ORGANIZATION";
  code: string;
}>;

export type OrganizationSelectEntity = _OrganizationSelectEntity;

type _OrganizationSelectProperties = Readonly<{
  type: "ORGANIZATION_SELECT";
  entities: readonly _OrganizationSelectEntity[];
}>;

export type OrganizationSelectProperties = _OrganizationSelectProperties;

type _GroupSelectEntity = Readonly<{
  type: "GROUP";
  code: string;
}>;

export type GroupSelectEntity = _GroupSelectEntity;

type _GroupSelectProperties = Readonly<{
  type: "GROUP_SELECT";
  entities: readonly _GroupSelectEntity[];
}>;

export type GroupSelectProperties = _GroupSelectProperties;

type _LookupFieldMapping = Readonly<{
  srcFieldCode: _FieldCode;
  destFieldCode: _FieldCode;
}>;

export type LookupFieldMapping = _LookupFieldMapping;

type _LookupProperties = Readonly<{
  type: "LOOKUP";
  relatedAppId: _AppId;
  relatedKeyFieldCode: _FieldCode;
  fieldMappings: readonly _LookupFieldMapping[];
  lookupPickerFields: readonly _FieldCode[];
  filterCondition: string | null;
  sort: _SortSpec | null;
}>;

export type LookupProperties = _LookupProperties;

type _ReferenceTableCondition = Readonly<{
  thisFieldCode: _FieldCode;
  relatedFieldCode: _FieldCode;
}>;

export type ReferenceTableCondition = _ReferenceTableCondition;

type _ReferenceTableProperties = Readonly<{
  type: "REFERENCE_TABLE";
  relatedAppId: _AppId;
  condition: _ReferenceTableCondition;
  additionalFilter: string | null;
  displayFields: readonly _FieldCode[];
  sort: _SortSpec | null;
  maxRecords: number;
}>;

export type ReferenceTableProperties = _ReferenceTableProperties;

type _SubtableProperties = Readonly<{
  type: "SUBTABLE";
}>;

export type SubtableProperties = _SubtableProperties;

type _GroupProperties = Readonly<{
  type: "GROUP";
  openGroup: boolean;
}>;

export type GroupProperties = _GroupProperties;

type _LabelProperties = Readonly<{
  type: "LABEL";
  label: string;
  elementId: string | null;
}>;

export type LabelProperties = _LabelProperties;

type _SpacerProperties = Readonly<{
  type: "SPACER";
  elementId: string | null;
}>;

export type SpacerProperties = _SpacerProperties;

type _HrProperties = Readonly<{
  type: "HR";
  elementId: string | null;
}>;

export type HrProperties = _HrProperties;

type _RecordNumberProperties = Readonly<{
  type: "RECORD_NUMBER";
}>;

export type RecordNumberProperties = _RecordNumberProperties;

type _CreatorProperties = Readonly<{
  type: "CREATOR";
}>;

export type CreatorProperties = _CreatorProperties;

type _ModifierProperties = Readonly<{
  type: "MODIFIER";
}>;

export type ModifierProperties = _ModifierProperties;

type _CreatedTimeProperties = Readonly<{
  type: "CREATED_TIME";
}>;

export type CreatedTimeProperties = _CreatedTimeProperties;

type _UpdatedTimeProperties = Readonly<{
  type: "UPDATED_TIME";
}>;

export type UpdatedTimeProperties = _UpdatedTimeProperties;

type _StatusProperties = Readonly<{
  type: "STATUS";
  enabled: boolean;
}>;

export type StatusProperties = _StatusProperties;

type _StatusAssigneeProperties = Readonly<{
  type: "STATUS_ASSIGNEE";
  enabled: boolean;
}>;

export type StatusAssigneeProperties = _StatusAssigneeProperties;

type _CategoryProperties = Readonly<{
  type: "CATEGORY";
  enabled: boolean;
}>;

export type CategoryProperties = _CategoryProperties;

export type FieldProperties =
  | _SingleLineTextProperties
  | _MultiLineTextProperties
  | _RichTextProperties
  | _NumberProperties
  | _CalcProperties
  | _RadioButtonProperties
  | _CheckBoxProperties
  | _MultiSelectProperties
  | _DropDownProperties
  | _DateProperties
  | _TimeProperties
  | _DateTimeProperties
  | _FileProperties
  | _LinkProperties
  | _UserSelectProperties
  | _OrganizationSelectProperties
  | _GroupSelectProperties
  | _LookupProperties
  | _ReferenceTableProperties
  | _SubtableProperties
  | _GroupProperties
  | _LabelProperties
  | _SpacerProperties
  | _HrProperties
  | _RecordNumberProperties
  | _CreatorProperties
  | _ModifierProperties
  | _CreatedTimeProperties
  | _UpdatedTimeProperties
  | _StatusProperties
  | _StatusAssigneeProperties
  | _CategoryProperties;

// ============================================
// ActionFieldMapping
// ============================================

type _ActionFieldMapping = Readonly<{
  srcFieldCode: _FieldCode;
  destFieldCode: _FieldCode;
}>;

export type ActionFieldMapping = _ActionFieldMapping;

export const ActionFieldMapping = {
  create: (
    srcFieldCode: _FieldCode,
    destFieldCode: _FieldCode,
  ): _ActionFieldMapping => ({
    srcFieldCode,
    destFieldCode,
  }),
};

// ============================================
// ActionAllowedEntity
// ============================================

type _ActionAllowedEntity = Readonly<{
  type: "USER" | "ORGANIZATION" | "GROUP" | "EVERYONE";
  code: string | null;
}>;

export type ActionAllowedEntity = _ActionAllowedEntity;

export const ActionAllowedEntity = {
  create: (
    type: "USER" | "ORGANIZATION" | "GROUP" | "EVERYONE",
    code: string | null,
  ): _ActionAllowedEntity => ({
    type,
    code,
  }),
  everyone: (): _ActionAllowedEntity => ({
    type: "EVERYONE",
    code: null,
  }),
};

// ============================================
// GeneralNotificationEvent
// ============================================

const GENERAL_NOTIFICATION_EVENTS = [
  "ADD_RECORD",
  "UPDATE_RECORD",
  "ADD_COMMENT",
  "UPDATE_STATUS",
  "IMPORT_FILE",
] as const;

type _GeneralNotificationEvent = (typeof GENERAL_NOTIFICATION_EVENTS)[number];

export type GeneralNotificationEvent = _GeneralNotificationEvent;

export const GeneralNotificationEvent = {
  create: (value: string): _GeneralNotificationEvent => {
    if (
      !GENERAL_NOTIFICATION_EVENTS.includes(value as _GeneralNotificationEvent)
    ) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidNotificationEvent,
        `Invalid notification event: ${value}`,
      );
    }
    return value as _GeneralNotificationEvent;
  },
  validValues: GENERAL_NOTIFICATION_EVENTS,
};

// ============================================
// RecipientType
// ============================================

const RECIPIENT_TYPES = [
  "USER",
  "ORGANIZATION",
  "GROUP",
  "FIELD_ENTITY",
  "CREATOR",
  "MODIFIER",
] as const;

type _RecipientType = (typeof RECIPIENT_TYPES)[number];

export type RecipientType = _RecipientType;

export const RecipientType = {
  create: (value: string): _RecipientType => {
    if (!RECIPIENT_TYPES.includes(value as _RecipientType)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidRecipientType,
        `Invalid recipient type: ${value}`,
      );
    }
    return value as _RecipientType;
  },
  validValues: RECIPIENT_TYPES,
};

// ============================================
// NotificationRecipient
// ============================================

type _NotificationRecipient = Readonly<{
  type: _RecipientType;
  code: string | null;
  fieldCode: _FieldCode | null;
}>;

export type NotificationRecipient = _NotificationRecipient;

export const NotificationRecipient = {
  create: (params: {
    type: _RecipientType;
    code: string | null;
    fieldCode: _FieldCode | null;
  }): _NotificationRecipient => ({
    type: params.type,
    code: params.code,
    fieldCode: params.fieldCode,
  }),
};

// ============================================
// GeneralNotification
// ============================================

type _GeneralNotification = Readonly<{
  recipients: readonly _NotificationRecipient[];
  events: readonly _GeneralNotificationEvent[];
  enableCommentTracking: boolean;
}>;

export type GeneralNotification = _GeneralNotification;

export const GeneralNotification = {
  create: (params: {
    recipients: readonly _NotificationRecipient[];
    events: readonly _GeneralNotificationEvent[];
    enableCommentTracking: boolean;
  }): _GeneralNotification => ({
    recipients: params.recipients,
    events: params.events,
    enableCommentTracking: params.enableCommentTracking,
  }),
};

// ============================================
// PerRecordNotification
// ============================================

type _PerRecordNotification = Readonly<{
  filterCondition: string;
  recipients: readonly _NotificationRecipient[];
}>;

export type PerRecordNotification = _PerRecordNotification;

export const PerRecordNotification = {
  create: (params: {
    filterCondition: string;
    recipients: readonly _NotificationRecipient[];
  }): _PerRecordNotification => ({
    filterCondition: params.filterCondition,
    recipients: params.recipients,
  }),
};

// ============================================
// ReminderNotification
// ============================================

type _ReminderNotification = Readonly<{
  dateFieldCode: _FieldCode;
  offsetDays: number;
  offsetTime: string | null;
  timezone: string;
  recipients: readonly _NotificationRecipient[];
}>;

export type ReminderNotification = _ReminderNotification;

export const ReminderNotification = {
  create: (params: {
    dateFieldCode: _FieldCode;
    offsetDays: number;
    offsetTime: string | null;
    timezone: string;
    recipients: readonly _NotificationRecipient[];
  }): _ReminderNotification => ({
    dateFieldCode: params.dateFieldCode,
    offsetDays: params.offsetDays,
    offsetTime: params.offsetTime,
    timezone: params.timezone,
    recipients: params.recipients,
  }),
};

// ============================================
// CustomizationScope
// ============================================

const CUSTOMIZATION_SCOPES = ["ALL_USERS", "ADMIN_ONLY", "NONE"] as const;

type _CustomizationScope = (typeof CUSTOMIZATION_SCOPES)[number];

export type CustomizationScope = _CustomizationScope;

export const CustomizationScope = {
  AllUsers: "ALL_USERS" as _CustomizationScope,
  AdminOnly: "ADMIN_ONLY" as _CustomizationScope,
  None: "NONE" as _CustomizationScope,
  create: (value: string): _CustomizationScope => {
    if (!CUSTOMIZATION_SCOPES.includes(value as _CustomizationScope)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidCustomizationScope,
        `Invalid customization scope: ${value}`,
      );
    }
    return value as _CustomizationScope;
  },
};

// ============================================
// CustomizationFileType
// ============================================

const CUSTOMIZATION_FILE_TYPES = ["URL", "FILE"] as const;

type _CustomizationFileType = (typeof CUSTOMIZATION_FILE_TYPES)[number];

export type CustomizationFileType = _CustomizationFileType;

export const CustomizationFileType = {
  Url: "URL" as _CustomizationFileType,
  File: "FILE" as _CustomizationFileType,
  create: (value: string): _CustomizationFileType => {
    if (!CUSTOMIZATION_FILE_TYPES.includes(value as _CustomizationFileType)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidCustomizationFileType,
        `Invalid customization file type: ${value}`,
      );
    }
    return value as _CustomizationFileType;
  },
};

// ============================================
// CustomizationFile
// ============================================

type _CustomizationFile = Readonly<{
  type: _CustomizationFileType;
  url: string | null;
  fileKey: string | null;
  name: string | null;
}>;

export type CustomizationFile = _CustomizationFile;

export const CustomizationFile = {
  createUrl: (url: string): _CustomizationFile => ({
    type: "URL",
    url,
    fileKey: null,
    name: null,
  }),
  createFile: (fileKey: string, name: string): _CustomizationFile => ({
    type: "FILE",
    url: null,
    fileKey,
    name,
  }),
};

// ============================================
// PlatformCustomization
// ============================================

type _PlatformCustomization = Readonly<{
  jsFiles: readonly _CustomizationFile[];
  cssFiles: readonly _CustomizationFile[];
}>;

export type PlatformCustomization = _PlatformCustomization;

export const PlatformCustomization = {
  create: (params: {
    jsFiles: readonly _CustomizationFile[];
    cssFiles: readonly _CustomizationFile[];
  }): _PlatformCustomization => ({
    jsFiles: params.jsFiles,
    cssFiles: params.cssFiles,
  }),
  empty: (): _PlatformCustomization => ({
    jsFiles: [],
    cssFiles: [],
  }),
};

// ============================================
// CategoryNode
// ============================================

type _CategoryNode = Readonly<{
  categoryId: _CategoryId;
  name: string;
  children: readonly _CategoryNode[];
}>;

export type CategoryNode = _CategoryNode;

export const CategoryNode = {
  create: (params: {
    categoryId: _CategoryId;
    name: string;
    children: readonly _CategoryNode[];
  }): _CategoryNode => {
    if (params.name.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyCategoryName,
        "Category name cannot be empty",
      );
    }
    return {
      categoryId: params.categoryId,
      name: params.name,
      children: params.children,
    };
  },
};

// ============================================
// I18nScope
// ============================================

const I18N_SCOPES = [
  "GENERAL",
  "FORM",
  "VIEW",
  "PROCESS",
  "REPORT",
  "CATEGORY",
  "ACTION",
] as const;

type _I18nScope = (typeof I18N_SCOPES)[number];

export type I18nScope = _I18nScope;

export const I18nScope = {
  create: (value: string): _I18nScope => {
    if (!I18N_SCOPES.includes(value as _I18nScope)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidI18nScope,
        `Invalid i18n scope: ${value}`,
      );
    }
    return value as _I18nScope;
  },
  validValues: I18N_SCOPES,
};

// ============================================
// AppLanguage
// ============================================

const APP_LANGUAGES = ["en", "ja", "zh", "zh-TW", "vi", "id", "th"] as const;

type _AppLanguage = (typeof APP_LANGUAGES)[number];

export type AppLanguage = _AppLanguage;

export const AppLanguage = {
  create: (value: string): _AppLanguage => {
    if (!APP_LANGUAGES.includes(value as _AppLanguage)) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidAppLanguage,
        `Invalid app language: ${value}`,
      );
    }
    return value as _AppLanguage;
  },
  validValues: APP_LANGUAGES,
};

// ============================================
// LocalizedName
// ============================================

type _LocalizedName = Readonly<{
  language: _AppLanguage;
  value: string;
}>;

export type LocalizedName = _LocalizedName;

export const LocalizedName = {
  create: (language: _AppLanguage, value: string): _LocalizedName => ({
    language,
    value,
  }),
};

// ============================================
// I18nTranslation
// ============================================

type _I18nTranslation = Readonly<{
  scope: _I18nScope;
  itemKey: string;
  localizedNames: readonly _LocalizedName[];
}>;

export type I18nTranslation = _I18nTranslation;

export const I18nTranslation = {
  create: (params: {
    scope: _I18nScope;
    itemKey: string;
    localizedNames: readonly _LocalizedName[];
  }): _I18nTranslation => ({
    scope: params.scope,
    itemKey: params.itemKey,
    localizedNames: params.localizedNames,
  }),
};

// ============================================
// SpaceId (App-local definition to avoid circular dependency with Space domain)
// ============================================

type _SpaceId = string & { readonly brand: "SpaceId" };

export type SpaceId = _SpaceId;

export const SpaceId = {
  create: (id: string): _SpaceId => {
    return id as _SpaceId;
  },
  generate: (): _SpaceId => {
    return uuidv7() as _SpaceId;
  },
};

// ============================================
// ThreadId (App-local definition to avoid circular dependency with Space domain)
// ============================================

type _ThreadId = string & { readonly brand: "ThreadId" };

export type ThreadId = _ThreadId;

export const ThreadId = {
  create: (id: string): _ThreadId => {
    return id as _ThreadId;
  },
  generate: (): _ThreadId => {
    return uuidv7() as _ThreadId;
  },
};
