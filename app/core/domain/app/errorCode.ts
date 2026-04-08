/**
 * Error codes for the App domain.
 */
export const AppErrorCode = {
  // App errors
  EmptyAppName: "APP_EMPTY_NAME",
  AppNameTooLong: "APP_NAME_TOO_LONG",
  InvalidAppCode: "APP_INVALID_CODE",
  DescriptionTooLong: "APP_DESCRIPTION_TOO_LONG",
  InvalidFiscalYearMonth: "APP_INVALID_FISCAL_YEAR_MONTH",
  InvalidRevision: "APP_INVALID_REVISION",
  RevisionConflict: "APP_REVISION_CONFLICT",
  DeletedAppModification: "APP_DELETED_MODIFICATION",
  ThreadWithoutSpace: "APP_THREAD_WITHOUT_SPACE",
  AlreadyDeleted: "APP_ALREADY_DELETED",
  NotDeleted: "APP_NOT_DELETED",
  InvalidAppStatus: "APP_INVALID_STATUS",
  InvalidAppTheme: "APP_INVALID_THEME",
  InvalidAppIconType: "APP_INVALID_ICON_TYPE",

  // NumberPrecision errors
  InvalidDigits: "APP_INVALID_DIGITS",
  InvalidDecimalPlaces: "APP_INVALID_DECIMAL_PLACES",
  InvalidRoundingMode: "APP_INVALID_ROUNDING_MODE",
  DecimalPlacesExceedsDigits: "APP_DECIMAL_PLACES_EXCEEDS_DIGITS",

  // Field errors
  EmptyFieldLabel: "APP_EMPTY_FIELD_LABEL",
  InvalidFieldType: "APP_INVALID_FIELD_TYPE",
  InvalidFieldCode: "APP_INVALID_FIELD_CODE",
  EmptyFieldCode: "APP_EMPTY_FIELD_CODE",
  SystemFieldModification: "APP_SYSTEM_FIELD_MODIFICATION",
  ImmutablePropertyModification: "APP_IMMUTABLE_PROPERTY_MODIFICATION",
  FieldNotAllowedInSubtable: "APP_FIELD_NOT_ALLOWED_IN_SUBTABLE",
  RequiredNotAllowed: "APP_REQUIRED_NOT_ALLOWED",
  UniqueNotAllowed: "APP_UNIQUE_NOT_ALLOWED",
  InvalidFieldProperties: "APP_INVALID_FIELD_PROPERTIES",
  InvalidDefaultValue: "APP_INVALID_DEFAULT_VALUE",
  FieldCodeDuplicate: "APP_FIELD_CODE_DUPLICATE",

  // FormLayout errors
  InvalidLayoutRowType: "APP_INVALID_LAYOUT_ROW_TYPE",
  SubtableInGroup: "APP_SUBTABLE_IN_GROUP",
  InvalidLayoutPosition: "APP_INVALID_LAYOUT_POSITION",
  FieldNotInLayout: "APP_FIELD_NOT_IN_LAYOUT",
  InvalidLayoutStructure: "APP_INVALID_LAYOUT_STRUCTURE",

  // View errors
  EmptyViewName: "APP_EMPTY_VIEW_NAME",
  InvalidViewType: "APP_INVALID_VIEW_TYPE",
  ViewNameDuplicate: "APP_VIEW_NAME_DUPLICATE",
  CalendarRequiresDateField: "APP_CALENDAR_REQUIRES_DATE_FIELD",
  BuiltinViewModification: "APP_BUILTIN_VIEW_MODIFICATION",
  ListViewRequiresFields: "APP_LIST_VIEW_REQUIRES_FIELDS",
  InvalidViewIndex: "APP_INVALID_VIEW_INDEX",

  // Report errors
  EmptyReportName: "APP_EMPTY_REPORT_NAME",
  InvalidChartType: "APP_INVALID_CHART_TYPE",
  InvalidChartSubType: "APP_INVALID_CHART_SUB_TYPE",
  TooManyGroups: "APP_TOO_MANY_GROUPS",
  TooManyAggregations: "APP_TOO_MANY_AGGREGATIONS",
  PivotTableRequiresGroups: "APP_PIVOT_TABLE_REQUIRES_GROUPS",
  PeriodicReportSettingsLocked: "APP_PERIODIC_REPORT_SETTINGS_LOCKED",
  PeriodicReportNotEnabled: "APP_PERIODIC_REPORT_NOT_ENABLED",
  PeriodicReportAlreadyRunning: "APP_PERIODIC_REPORT_ALREADY_RUNNING",
  PeriodicReportAlreadyPaused: "APP_PERIODIC_REPORT_ALREADY_PAUSED",
  InvalidPeriodicInterval: "APP_INVALID_PERIODIC_INTERVAL",

  // ProcessDefinition errors
  InitialStatusDeletion: "APP_INITIAL_STATUS_DELETION",
  InitialStatusReorder: "APP_INITIAL_STATUS_REORDER",
  EmptyStatusName: "APP_EMPTY_STATUS_NAME",
  StatusNotFound: "APP_STATUS_NOT_FOUND",
  StatusInUseByTransition: "APP_STATUS_IN_USE_BY_TRANSITION",
  TransitionNotFound: "APP_TRANSITION_NOT_FOUND",
  NoInitialStatus: "APP_NO_INITIAL_STATUS",

  // WebhookConfig errors
  InvalidWebhookUrl: "APP_INVALID_WEBHOOK_URL",
  WebhookUrlNotHttps: "APP_WEBHOOK_URL_NOT_HTTPS",
  EmptyWebhookEvents: "APP_EMPTY_WEBHOOK_EVENTS",
  InvalidWebhookEvent: "APP_INVALID_WEBHOOK_EVENT",

  // ApiTokenConfig errors
  EmptyApiScopes: "APP_EMPTY_API_SCOPES",
  InvalidApiScope: "APP_INVALID_API_SCOPE",

  // AppNotificationConfig errors
  InvalidRecipientType: "APP_INVALID_RECIPIENT_TYPE",
  InvalidNotificationEvent: "APP_INVALID_NOTIFICATION_EVENT",

  // AppAction errors
  EmptyActionName: "APP_EMPTY_ACTION_NAME",
  InvalidActionIndex: "APP_INVALID_ACTION_INDEX",

  // AppCustomization errors
  InvalidCustomizationScope: "APP_INVALID_CUSTOMIZATION_SCOPE",
  InvalidCustomizationFileType: "APP_INVALID_CUSTOMIZATION_FILE_TYPE",

  // PluginConfig errors
  EmptyPluginConfig: "APP_EMPTY_PLUGIN_CONFIG",
  PluginConfigTooLarge: "APP_PLUGIN_CONFIG_TOO_LARGE",

  // AppCategory errors
  EmptyCategoryName: "APP_EMPTY_CATEGORY_NAME",
  CategoryNotFound: "APP_CATEGORY_NOT_FOUND",

  // AppI18nConfig errors
  InvalidI18nScope: "APP_INVALID_I18N_SCOPE",
  InvalidAppLanguage: "APP_INVALID_APP_LANGUAGE",

  // AppGroup errors
  EmptyAppGroupName: "APP_EMPTY_APP_GROUP_NAME",
  AppGroupNameTooLong: "APP_APP_GROUP_NAME_TOO_LONG",
  AppGroupNotFound: "APP_APP_GROUP_NOT_FOUND",
  DuplicateDefaultGroup: "APP_DUPLICATE_DEFAULT_GROUP",

  // AppTemplate errors
  EmptyAppTemplateName: "APP_EMPTY_APP_TEMPLATE_NAME",
  AppTemplateNameTooLong: "APP_APP_TEMPLATE_NAME_TOO_LONG",
  AppTemplateNotFound: "APP_APP_TEMPLATE_NOT_FOUND",
  AppTemplateImportFailed: "APP_APP_TEMPLATE_IMPORT_FAILED",
  AppTemplateExportFailed: "APP_APP_TEMPLATE_EXPORT_FAILED",

  // Plugin (system) errors
  EmptyPluginName: "APP_EMPTY_PLUGIN_NAME",
  PluginNameTooLong: "APP_PLUGIN_NAME_TOO_LONG",
  PluginNotFound: "APP_PLUGIN_NOT_FOUND",
  PreinstalledPluginModification: "APP_PREINSTALLED_PLUGIN_MODIFICATION",
  PluginImportFailed: "APP_PLUGIN_IMPORT_FAILED",
  InvalidPluginStatus: "APP_INVALID_PLUGIN_STATUS",
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];
