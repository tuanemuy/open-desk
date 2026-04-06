import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId } from "@/core/domain/identity/valueObject";
import { AppErrorCode } from "./errorCode";
import type { AppEvent, FieldEvent, ReportEvent, ViewEvent } from "./events";
import { AppEvents } from "./events";
import type {
  ActionAllowedEntity as ActionAllowedEntityType,
  ActionFieldMapping as ActionFieldMappingType,
  ApiScope as ApiScopeType,
  ApiTokenId as ApiTokenIdType,
  AppActionId as AppActionIdType,
  AppCode as AppCodeType,
  AppFeatureFlags as AppFeatureFlagsType,
  AppIcon as AppIconType,
  AppId as AppIdType,
  AppLanguage as AppLanguageType,
  AppName as AppNameType,
  AppStatus as AppStatusType,
  AppTheme as AppThemeType,
  BuiltinViewType as BuiltinViewTypeType,
  CategoryId as CategoryIdType,
  CategoryNode as CategoryNodeType,
  ChartSubType as ChartSubTypeType,
  ChartType as ChartTypeType,
  CustomizationFile as CustomizationFileType,
  CustomizationScope as CustomizationScopeType,
  DeviceScope as DeviceScopeType,
  FieldCode as FieldCodeType,
  FieldDefaultValue as FieldDefaultValueType,
  FieldId as FieldIdType,
  FieldProperties,
  FieldSize as FieldSizeType,
  FieldType as FieldTypeType,
  GeneralNotification as GeneralNotificationType,
  I18nScope as I18nScopeType,
  I18nTranslation as I18nTranslationType,
  LayoutField as LayoutFieldType,
  LayoutPosition as LayoutPositionType,
  LayoutRow as LayoutRowType,
  LocalizedName as LocalizedNameType,
  NumberPrecision as NumberPrecisionType,
  PeriodicReportConfig as PeriodicReportConfigType,
  PerRecordNotification as PerRecordNotificationType,
  PlatformCustomization as PlatformCustomizationType,
  PluginId as PluginIdType,
  ProcessStatusId as ProcessStatusIdType,
  ProcessStatus as ProcessStatusType,
  ProcessTransitionId as ProcessTransitionIdType,
  ProcessTransitionInput as ProcessTransitionInputType,
  ProcessTransition as ProcessTransitionType,
  ReminderNotification as ReminderNotificationType,
  ReportAggregation as ReportAggregationType,
  ReportGroup as ReportGroupType,
  ReportId as ReportIdType,
  ReportSortSpec as ReportSortSpecType,
  Revision as RevisionType,
  SortSpec as SortSpecType,
  SpaceId,
  ThreadId,
  TitleFieldConfig as TitleFieldConfigType,
  ViewId as ViewIdType,
  ViewType as ViewTypeType,
  WebhookEvent as WebhookEventType,
  WebhookId as WebhookIdType,
  WebhookUrl as WebhookUrlType,
} from "./valueObject";
import {
  ApiTokenId,
  AppActionId,
  AppIcon,
  AppId,
  AppName,
  AppStatus,
  AppTheme,
  CategoryId,
  CategoryNode,
  FieldCode,
  FieldId,
  FieldType,
  LocalizedName,
  NumberPrecision,
  PlatformCustomization,
  ProcessStatus,
  ProcessStatusId,
  ProcessTransition,
  ProcessTransitionId,
  ReportId,
  Revision,
  TitleFieldConfig,
  ViewId,
  WebhookId,
} from "./valueObject";

// ============================================
// Constants
// ============================================

const APP_DESCRIPTION_MAX_LENGTH = 10000;
const FISCAL_YEAR_MONTH_MIN = 1;
const FISCAL_YEAR_MONTH_MAX = 12;
const MAX_REPORT_GROUPS = 3;
const MAX_REPORT_AGGREGATIONS = 10;
const MAX_PIVOT_TABLE_AGGREGATIONS = 1;
const PLUGIN_CONFIG_MAX_SIZE = 256 * 1024;

// ============================================
// App Entity
// ============================================

type _App = Readonly<{
  appId: AppIdType;
  code: AppCodeType | null;
  name: AppNameType;
  description: string | null;
  spaceId: SpaceId | null;
  threadId: ThreadId | null;
  theme: AppThemeType;
  icon: AppIconType;
  titleField: TitleFieldConfigType;
  enableThumbnails: boolean;
  enableBulkDeletion: boolean;
  enableRecordHistory: boolean;
  enableComments: boolean;
  enableDuplicateRecord: boolean;
  enableInlineEditing: boolean;
  numberPrecision: NumberPrecisionType;
  firstMonthOfFiscalYear: number;
  revision: RevisionType;
  status: AppStatusType;
  creatorId: UserId;
  modifierId: UserId;
  createdAt: Date;
  updatedAt: Date;
}>;

export type App = _App;

function assertNotDeleted(app: _App): void {
  if (AppStatus.isDeleted(app.status)) {
    throw new BusinessRuleError(
      AppErrorCode.DeletedAppModification,
      "Cannot modify a deleted app",
    );
  }
}

export const App = {
  create: (params: {
    name: string;
    creatorId: UserId;
    spaceId?: SpaceId | null;
    threadId?: ThreadId | null;
  }): WithEvents<_App, AppEvent> => {
    const spaceId = params.spaceId ?? null;
    const threadId = params.threadId ?? null;
    if (threadId !== null && spaceId === null) {
      throw new BusinessRuleError(
        AppErrorCode.ThreadWithoutSpace,
        "threadId requires spaceId to be set",
      );
    }
    const now = new Date();
    const app: _App = {
      appId: AppId.generate(),
      code: null,
      name: AppName.create(params.name),
      description: null,
      spaceId,
      threadId,
      theme: AppTheme.White,
      icon: AppIcon.default(),
      titleField: TitleFieldConfig.auto(),
      enableThumbnails: false,
      enableBulkDeletion: false,
      enableRecordHistory: false,
      enableComments: true,
      enableDuplicateRecord: true,
      enableInlineEditing: true,
      numberPrecision: NumberPrecision.default(),
      firstMonthOfFiscalYear: 1,
      revision: Revision.initial(),
      status: AppStatus.Preview,
      creatorId: params.creatorId,
      modifierId: params.creatorId,
      createdAt: now,
      updatedAt: now,
    };
    return {
      entity: app,
      events: [AppEvents.created(app.appId)],
    };
  },

  reconstruct: (data: _App): _App => data,

  rename: (app: _App, name: string): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        name: AppName.create(name),
        updatedAt: new Date(),
      },
      events: [AppEvents.settingsUpdated(app.appId)],
    };
  },

  setCode: (
    app: _App,
    code: AppCodeType | null,
  ): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        code,
        updatedAt: new Date(),
      },
      events: [AppEvents.settingsUpdated(app.appId)],
    };
  },

  setDescription: (
    app: _App,
    description: string | null,
  ): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    if (
      description !== null &&
      description.length > APP_DESCRIPTION_MAX_LENGTH
    ) {
      throw new BusinessRuleError(
        AppErrorCode.DescriptionTooLong,
        `App description exceeds maximum length of ${APP_DESCRIPTION_MAX_LENGTH} characters`,
      );
    }
    return {
      entity: {
        ...app,
        description,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  setTheme: (app: _App, theme: AppThemeType): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        theme,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  setIcon: (app: _App, icon: AppIconType): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        icon,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  setTitleField: (
    app: _App,
    config: TitleFieldConfigType,
  ): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        titleField: config,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  setNumberPrecision: (
    app: _App,
    precision: NumberPrecisionType,
  ): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        numberPrecision: precision,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  setFiscalYearStart: (
    app: _App,
    month: number,
  ): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    if (month < FISCAL_YEAR_MONTH_MIN || month > FISCAL_YEAR_MONTH_MAX) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidFiscalYearMonth,
        `Fiscal year start month must be between ${FISCAL_YEAR_MONTH_MIN} and ${FISCAL_YEAR_MONTH_MAX}`,
      );
    }
    return {
      entity: {
        ...app,
        firstMonthOfFiscalYear: month,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  updateFeatureFlags: (
    app: _App,
    flags: AppFeatureFlagsType,
  ): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        enableThumbnails: flags.enableThumbnails ?? app.enableThumbnails,
        enableBulkDeletion: flags.enableBulkDeletion ?? app.enableBulkDeletion,
        enableRecordHistory:
          flags.enableRecordHistory ?? app.enableRecordHistory,
        enableComments: flags.enableComments ?? app.enableComments,
        enableDuplicateRecord:
          flags.enableDuplicateRecord ?? app.enableDuplicateRecord,
        enableInlineEditing:
          flags.enableInlineEditing ?? app.enableInlineEditing,
        updatedAt: new Date(),
      },
      events: [AppEvents.settingsUpdated(app.appId)],
    };
  },

  deploy: (app: _App): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        status: AppStatus.Active,
        updatedAt: new Date(),
      },
      events: [AppEvents.deployed(app.appId)],
    };
  },

  revert: (app: _App): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  incrementRevision: (app: _App): WithEvents<_App, AppEvent> => {
    return {
      entity: {
        ...app,
        revision: Revision.increment(app.revision),
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  checkRevision: (app: _App, expectedRevision: RevisionType): void => {
    if (app.revision !== expectedRevision) {
      throw new BusinessRuleError(
        AppErrorCode.RevisionConflict,
        `Revision conflict: expected ${expectedRevision}, got ${app.revision}`,
      );
    }
  },

  markAsDeleted: (app: _App): WithEvents<_App, AppEvent> => {
    if (AppStatus.isDeleted(app.status)) {
      throw new BusinessRuleError(
        AppErrorCode.AlreadyDeleted,
        "App is already deleted",
      );
    }
    return {
      entity: {
        ...app,
        status: AppStatus.Deleted,
        updatedAt: new Date(),
      },
      events: [AppEvents.deleted(app.appId)],
    };
  },

  restore: (app: _App): WithEvents<_App, AppEvent> => {
    if (!AppStatus.isDeleted(app.status)) {
      throw new BusinessRuleError(
        AppErrorCode.NotDeleted,
        "App is not deleted",
      );
    }
    return {
      entity: {
        ...app,
        status: AppStatus.Active,
        updatedAt: new Date(),
      },
      events: [AppEvents.restored(app.appId)],
    };
  },

  assignToSpace: (
    app: _App,
    spaceId: SpaceId,
    threadId: ThreadId,
  ): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        spaceId,
        threadId,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  removeFromSpace: (app: _App): WithEvents<_App, AppEvent> => {
    assertNotDeleted(app);
    return {
      entity: {
        ...app,
        spaceId: null,
        threadId: null,
        updatedAt: new Date(),
      },
      events: [],
    };
  },
};

// ============================================
// Field Entity
// ============================================

type _Field = Readonly<{
  fieldId: FieldIdType;
  appId: AppIdType;
  fieldCode: FieldCodeType;
  label: string;
  noLabel: boolean;
  fieldType: FieldTypeType;
  required: boolean;
  unique: boolean;
  defaultValue: FieldDefaultValueType | null;
  properties: FieldProperties;
}>;

export type Field = _Field;

export const Field = {
  create: (params: {
    appId: AppIdType;
    fieldCode: string;
    label: string;
    fieldType: FieldTypeType;
    required?: boolean;
    unique?: boolean;
    defaultValue?: FieldDefaultValueType | null;
    properties: FieldProperties;
  }): WithEvents<_Field, FieldEvent> => {
    if (params.label.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyFieldLabel,
        "Field label cannot be empty",
      );
    }
    const required = params.required ?? false;
    if (required && !FieldType.canBeRequired(params.fieldType)) {
      throw new BusinessRuleError(
        AppErrorCode.RequiredNotAllowed,
        `Field type ${params.fieldType} cannot be set as required`,
      );
    }
    const unique = params.unique ?? false;
    if (unique && !FieldType.canBeUnique(params.fieldType)) {
      throw new BusinessRuleError(
        AppErrorCode.UniqueNotAllowed,
        `Field type ${params.fieldType} cannot be set as unique`,
      );
    }
    const field: _Field = {
      fieldId: FieldId.generate(),
      appId: params.appId,
      fieldCode: FieldCode.create(params.fieldCode),
      label: params.label,
      noLabel: false,
      fieldType: params.fieldType,
      required,
      unique,
      defaultValue: params.defaultValue ?? null,
      properties: params.properties,
    };
    return {
      entity: field,
      events: [AppEvents.fieldAdded(field.appId, field.fieldId)],
    };
  },

  reconstruct: (data: _Field): _Field => data,

  updateLabel: (
    field: _Field,
    label: string,
  ): WithEvents<_Field, FieldEvent> => {
    if (label.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyFieldLabel,
        "Field label cannot be empty",
      );
    }
    return {
      entity: {
        ...field,
        label,
      },
      events: [AppEvents.fieldUpdated(field.appId, field.fieldId)],
    };
  },

  updateFieldCode: (
    field: _Field,
    code: string,
  ): WithEvents<_Field, FieldEvent> => {
    if (FieldType.isSystemField(field.fieldType)) {
      throw new BusinessRuleError(
        AppErrorCode.SystemFieldModification,
        "Cannot change field code of a system field",
      );
    }
    return {
      entity: {
        ...field,
        fieldCode: FieldCode.create(code),
      },
      events: [AppEvents.fieldUpdated(field.appId, field.fieldId)],
    };
  },

  setNoLabel: (
    field: _Field,
    noLabel: boolean,
  ): WithEvents<_Field, FieldEvent> => {
    return {
      entity: {
        ...field,
        noLabel,
      },
      events: [],
    };
  },

  setRequired: (
    field: _Field,
    required: boolean,
  ): WithEvents<_Field, FieldEvent> => {
    if (required && !FieldType.canBeRequired(field.fieldType)) {
      throw new BusinessRuleError(
        AppErrorCode.RequiredNotAllowed,
        `Field type ${field.fieldType} cannot be set as required`,
      );
    }
    return {
      entity: {
        ...field,
        required,
      },
      events: [],
    };
  },

  setUnique: (
    field: _Field,
    unique: boolean,
  ): WithEvents<_Field, FieldEvent> => {
    if (unique && !FieldType.canBeUnique(field.fieldType)) {
      throw new BusinessRuleError(
        AppErrorCode.UniqueNotAllowed,
        `Field type ${field.fieldType} cannot be set as unique`,
      );
    }
    return {
      entity: {
        ...field,
        unique,
      },
      events: [],
    };
  },

  setDefaultValue: (
    field: _Field,
    value: FieldDefaultValueType | null,
  ): WithEvents<_Field, FieldEvent> => {
    return {
      entity: {
        ...field,
        defaultValue: value,
      },
      events: [],
    };
  },

  updateProperties: (
    field: _Field,
    props: FieldProperties,
  ): WithEvents<_Field, FieldEvent> => {
    if (props.type !== field.fieldType) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidFieldProperties,
        `Properties type ${props.type} does not match field type ${field.fieldType}`,
      );
    }
    return {
      entity: {
        ...field,
        properties: props,
      },
      events: [AppEvents.fieldUpdated(field.appId, field.fieldId)],
    };
  },

  isSystemField: (field: _Field): boolean =>
    FieldType.isSystemField(field.fieldType),

  isImmutableAfterSave: (field: _Field): boolean => {
    switch (field.fieldType) {
      case "LOOKUP":
        return true;
      case "REFERENCE_TABLE":
        return true;
      case "LINK":
        return true;
      default:
        return false;
    }
  },

  canBeInSubtable: (field: _Field): boolean =>
    FieldType.canBeInSubtable(field.fieldType),
};

// ============================================
// FormLayout Entity
// ============================================

type _FormLayout = Readonly<{
  appId: AppIdType;
  rows: readonly LayoutRowType[];
  revision: RevisionType;
}>;

export type FormLayout = _FormLayout;

export const FormLayout = {
  create: (params: {
    appId: AppIdType;
    rows: readonly LayoutRowType[];
  }): _FormLayout => ({
    appId: params.appId,
    rows: params.rows,
    revision: Revision.initial(),
  }),

  reconstruct: (data: _FormLayout): _FormLayout => data,

  addField: (
    layout: _FormLayout,
    field: LayoutFieldType,
    position: LayoutPositionType,
  ): _FormLayout => {
    const rows = [...layout.rows];
    if (position.rowIndex >= rows.length) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidLayoutPosition,
        "Row index out of bounds",
      );
    }
    const row = rows[position.rowIndex];
    const fields = [...row.fields];
    fields.splice(position.fieldIndex, 0, field);
    rows[position.rowIndex] = { ...row, fields };
    return { ...layout, rows };
  },

  removeField: (layout: _FormLayout, fieldCode: FieldCodeType): _FormLayout => {
    const rows = layout.rows.map((row) => ({
      ...row,
      fields: row.fields.filter((f) => f.code !== fieldCode),
      innerLayout: row.innerLayout
        ? row.innerLayout.map((innerRow) => ({
            ...innerRow,
            fields: innerRow.fields.filter((f) => f.code !== fieldCode),
          }))
        : null,
    }));
    return { ...layout, rows };
  },

  moveField: (
    layout: _FormLayout,
    fieldCode: FieldCodeType,
    newPosition: LayoutPositionType,
  ): _FormLayout => {
    let movedField: LayoutFieldType | null = null;

    const rowsWithout = layout.rows.map((row) => {
      const fieldIndex = row.fields.findIndex((f) => f.code === fieldCode);
      if (fieldIndex >= 0) {
        movedField = row.fields[fieldIndex];
        const fields = [...row.fields];
        fields.splice(fieldIndex, 1);
        return { ...row, fields };
      }
      return row;
    });

    if (movedField === null) {
      throw new BusinessRuleError(
        AppErrorCode.FieldNotInLayout,
        `Field ${fieldCode} not found in layout`,
      );
    }

    const rows = [...rowsWithout];
    if (newPosition.rowIndex >= rows.length) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidLayoutPosition,
        "Row index out of bounds",
      );
    }
    const targetRow = rows[newPosition.rowIndex];
    const fields = [...targetRow.fields];
    fields.splice(newPosition.fieldIndex, 0, movedField);
    rows[newPosition.rowIndex] = { ...targetRow, fields };
    return { ...layout, rows };
  },

  addGroup: (
    layout: _FormLayout,
    code: FieldCodeType,
    _openGroup: boolean,
    innerFields: readonly LayoutFieldType[],
  ): _FormLayout => {
    const innerRows: LayoutRowType[] = innerFields.map((f) => ({
      type: "ROW" as const,
      code: null,
      fields: [f],
      innerLayout: null,
    }));
    const groupRow: LayoutRowType = {
      type: "GROUP",
      code,
      fields: [],
      innerLayout: innerRows,
    };
    return { ...layout, rows: [...layout.rows, groupRow] };
  },

  addSubtable: (
    layout: _FormLayout,
    code: FieldCodeType,
    fields: readonly LayoutFieldType[],
  ): _FormLayout => {
    const subtableRow: LayoutRowType = {
      type: "SUBTABLE",
      code,
      fields: [...fields],
      innerLayout: null,
    };
    return { ...layout, rows: [...layout.rows, subtableRow] };
  },

  removeRow: (layout: _FormLayout, index: number): _FormLayout => {
    const rows = [...layout.rows];
    rows.splice(index, 1);
    return { ...layout, rows };
  },

  reorderRows: (layout: _FormLayout, order: readonly number[]): _FormLayout => {
    const rows = order.map((i) => layout.rows[i]);
    return { ...layout, rows };
  },

  resizeField: (
    layout: _FormLayout,
    fieldCode: FieldCodeType,
    size: FieldSizeType,
  ): _FormLayout => {
    const rows = layout.rows.map((row) => ({
      ...row,
      fields: row.fields.map((f) =>
        f.code === fieldCode ? { ...f, size } : f,
      ),
      innerLayout: row.innerLayout
        ? row.innerLayout.map((innerRow) => ({
            ...innerRow,
            fields: innerRow.fields.map((f) =>
              f.code === fieldCode ? { ...f, size } : f,
            ),
          }))
        : null,
    }));
    return { ...layout, rows };
  },

  replaceAll: (
    layout: _FormLayout,
    rows: readonly LayoutRowType[],
  ): _FormLayout => {
    return { ...layout, rows };
  },
};

// ============================================
// View Entity
// ============================================

type _View = Readonly<{
  viewId: ViewIdType;
  appId: AppIdType;
  viewName: string;
  viewType: ViewTypeType;
  fields: readonly FieldCodeType[];
  calendarDateField: FieldCodeType | null;
  calendarTitleField: FieldCodeType | null;
  html: string | null;
  pager: boolean;
  deviceScope: DeviceScopeType | null;
  filterCondition: string | null;
  sort: readonly SortSpecType[];
  index: number;
  builtinType: BuiltinViewTypeType | null;
}>;

export type View = _View;

export const View = {
  create: (params: {
    appId: AppIdType;
    viewName: string;
    viewType: ViewTypeType;
    fields?: readonly FieldCodeType[];
    calendarDateField?: FieldCodeType | null;
    calendarTitleField?: FieldCodeType | null;
    html?: string | null;
    pager?: boolean;
    deviceScope?: DeviceScopeType | null;
    filterCondition?: string | null;
    sort?: readonly SortSpecType[];
    index: number;
    builtinType?: BuiltinViewTypeType | null;
  }): WithEvents<_View, ViewEvent> => {
    if (params.viewName.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyViewName,
        "View name cannot be empty",
      );
    }
    const fields = params.fields ?? [];
    if (params.viewType === "LIST" && fields.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.ListViewRequiresFields,
        "LIST view must have at least one field",
      );
    }
    if (params.viewType === "CALENDAR" && !params.calendarDateField) {
      throw new BusinessRuleError(
        AppErrorCode.CalendarRequiresDateField,
        "CALENDAR view must specify a date field",
      );
    }
    const view: _View = {
      viewId: ViewId.generate(),
      appId: params.appId,
      viewName: params.viewName,
      viewType: params.viewType,
      fields,
      calendarDateField: params.calendarDateField ?? null,
      calendarTitleField: params.calendarTitleField ?? null,
      html: params.html ?? null,
      pager: params.pager ?? false,
      deviceScope: params.deviceScope ?? null,
      filterCondition: params.filterCondition ?? null,
      sort: params.sort ?? [],
      index: params.index,
      builtinType: params.builtinType ?? null,
    };
    return {
      entity: view,
      events: [AppEvents.viewCreated(view.appId, view.viewId)],
    };
  },

  reconstruct: (data: _View): _View => data,

  rename: (view: _View, name: string): WithEvents<_View, ViewEvent> => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyViewName,
        "View name cannot be empty",
      );
    }
    return {
      entity: { ...view, viewName: name },
      events: [],
    };
  },

  setFields: (
    view: _View,
    fields: readonly FieldCodeType[],
  ): WithEvents<_View, ViewEvent> => {
    if (view.viewType === "LIST" && fields.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.ListViewRequiresFields,
        "LIST view must have at least one field",
      );
    }
    return {
      entity: { ...view, fields },
      events: [],
    };
  },

  setCalendarFields: (
    view: _View,
    dateField: FieldCodeType,
    titleField: FieldCodeType,
  ): WithEvents<_View, ViewEvent> => {
    return {
      entity: {
        ...view,
        calendarDateField: dateField,
        calendarTitleField: titleField,
      },
      events: [],
    };
  },

  setHtml: (view: _View, html: string): WithEvents<_View, ViewEvent> => {
    return {
      entity: { ...view, html },
      events: [],
    };
  },

  setFilter: (
    view: _View,
    condition: string | null,
  ): WithEvents<_View, ViewEvent> => {
    return {
      entity: { ...view, filterCondition: condition },
      events: [],
    };
  },

  setSort: (
    view: _View,
    sort: readonly SortSpecType[],
  ): WithEvents<_View, ViewEvent> => {
    return {
      entity: { ...view, sort },
      events: [],
    };
  },

  reorder: (view: _View, index: number): WithEvents<_View, ViewEvent> => {
    if (index < 0) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidViewIndex,
        "View index must be non-negative",
      );
    }
    return {
      entity: { ...view, index },
      events: [],
    };
  },

  isBuiltin: (view: _View): boolean => view.builtinType !== null,

  duplicate: (view: _View, newName: string): WithEvents<_View, ViewEvent> => {
    if (view.builtinType !== null) {
      throw new BusinessRuleError(
        AppErrorCode.BuiltinViewModification,
        "Builtin views cannot be duplicated",
      );
    }
    if (newName.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyViewName,
        "View name cannot be empty",
      );
    }
    const newView: _View = {
      ...view,
      viewId: ViewId.generate(),
      viewName: newName,
      builtinType: null,
    };
    return {
      entity: newView,
      events: [AppEvents.viewCreated(newView.appId, newView.viewId)],
    };
  },
};

// ============================================
// Report Entity
// ============================================

type _Report = Readonly<{
  reportId: ReportIdType;
  appId: AppIdType;
  reportName: string;
  chartType: ChartTypeType;
  chartSubType: ChartSubTypeType | null;
  groups: readonly ReportGroupType[];
  aggregations: readonly ReportAggregationType[];
  filterCondition: string | null;
  sort: readonly ReportSortSpecType[];
  periodicReport: PeriodicReportConfigType | null;
}>;

export type Report = _Report;

export const Report = {
  create: (params: {
    appId: AppIdType;
    reportName: string;
    chartType: ChartTypeType;
    chartSubType?: ChartSubTypeType | null;
    groups?: readonly ReportGroupType[];
    aggregations?: readonly ReportAggregationType[];
    filterCondition?: string | null;
    sort?: readonly ReportSortSpecType[];
  }): WithEvents<_Report, ReportEvent> => {
    if (params.reportName.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyReportName,
        "Report name cannot be empty",
      );
    }
    const groups = params.groups ?? [];
    const aggregations = params.aggregations ?? [];
    validateReportConstraints(params.chartType, groups, aggregations);

    const report: _Report = {
      reportId: ReportId.generate(),
      appId: params.appId,
      reportName: params.reportName,
      chartType: params.chartType,
      chartSubType: params.chartSubType ?? null,
      groups,
      aggregations,
      filterCondition: params.filterCondition ?? null,
      sort: params.sort ?? [],
      periodicReport: null,
    };
    return {
      entity: report,
      events: [AppEvents.reportCreated(report.appId, report.reportId)],
    };
  },

  reconstruct: (data: _Report): _Report => data,

  rename: (report: _Report, name: string): WithEvents<_Report, ReportEvent> => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyReportName,
        "Report name cannot be empty",
      );
    }
    return {
      entity: { ...report, reportName: name },
      events: [],
    };
  },

  setChartType: (
    report: _Report,
    type: ChartTypeType,
    subType: ChartSubTypeType | null,
  ): WithEvents<_Report, ReportEvent> => {
    assertReportNotLocked(report);
    return {
      entity: { ...report, chartType: type, chartSubType: subType },
      events: [],
    };
  },

  setGroups: (
    report: _Report,
    groups: readonly ReportGroupType[],
  ): WithEvents<_Report, ReportEvent> => {
    assertReportNotLocked(report);
    if (groups.length > MAX_REPORT_GROUPS) {
      throw new BusinessRuleError(
        AppErrorCode.TooManyGroups,
        `Maximum ${MAX_REPORT_GROUPS} groups allowed`,
      );
    }
    return {
      entity: { ...report, groups },
      events: [],
    };
  },

  setAggregations: (
    report: _Report,
    aggregations: readonly ReportAggregationType[],
  ): WithEvents<_Report, ReportEvent> => {
    assertReportNotLocked(report);
    const max =
      report.chartType === "PIVOT_TABLE"
        ? MAX_PIVOT_TABLE_AGGREGATIONS
        : MAX_REPORT_AGGREGATIONS;
    if (aggregations.length > max) {
      throw new BusinessRuleError(
        AppErrorCode.TooManyAggregations,
        `Maximum ${max} aggregations allowed for ${report.chartType}`,
      );
    }
    return {
      entity: { ...report, aggregations },
      events: [],
    };
  },

  setFilter: (
    report: _Report,
    condition: string | null,
  ): WithEvents<_Report, ReportEvent> => {
    assertReportNotLocked(report);
    return {
      entity: { ...report, filterCondition: condition },
      events: [],
    };
  },

  setSort: (
    report: _Report,
    sort: readonly ReportSortSpecType[],
  ): WithEvents<_Report, ReportEvent> => {
    assertReportNotLocked(report);
    return {
      entity: { ...report, sort },
      events: [],
    };
  },

  enablePeriodicReport: (
    report: _Report,
    config: PeriodicReportConfigType,
  ): WithEvents<_Report, ReportEvent> => {
    return {
      entity: { ...report, periodicReport: config },
      events: [],
    };
  },

  disablePeriodicReport: (
    report: _Report,
  ): WithEvents<_Report, ReportEvent> => {
    if (report.periodicReport === null) {
      throw new BusinessRuleError(
        AppErrorCode.PeriodicReportNotEnabled,
        "Periodic report is not enabled",
      );
    }
    return {
      entity: { ...report, periodicReport: null },
      events: [],
    };
  },

  pausePeriodicReport: (report: _Report): WithEvents<_Report, ReportEvent> => {
    if (report.periodicReport === null) {
      throw new BusinessRuleError(
        AppErrorCode.PeriodicReportNotEnabled,
        "Periodic report is not enabled",
      );
    }
    if (!report.periodicReport.isRunning) {
      throw new BusinessRuleError(
        AppErrorCode.PeriodicReportAlreadyPaused,
        "Periodic report is already paused",
      );
    }
    return {
      entity: {
        ...report,
        periodicReport: { ...report.periodicReport, isRunning: false },
      },
      events: [],
    };
  },

  resumePeriodicReport: (report: _Report): WithEvents<_Report, ReportEvent> => {
    if (report.periodicReport === null) {
      throw new BusinessRuleError(
        AppErrorCode.PeriodicReportNotEnabled,
        "Periodic report is not enabled",
      );
    }
    if (report.periodicReport.isRunning) {
      throw new BusinessRuleError(
        AppErrorCode.PeriodicReportAlreadyRunning,
        "Periodic report is already running",
      );
    }
    return {
      entity: {
        ...report,
        periodicReport: { ...report.periodicReport, isRunning: true },
      },
      events: [],
    };
  },

  isSettingsLocked: (report: _Report): boolean =>
    report.periodicReport !== null,
};

function assertReportNotLocked(report: _Report): void {
  if (report.periodicReport !== null) {
    throw new BusinessRuleError(
      AppErrorCode.PeriodicReportSettingsLocked,
      "Report settings are locked while periodic report is enabled",
    );
  }
}

function validateReportConstraints(
  chartType: ChartTypeType,
  groups: readonly ReportGroupType[],
  aggregations: readonly ReportAggregationType[],
): void {
  if (groups.length > MAX_REPORT_GROUPS) {
    throw new BusinessRuleError(
      AppErrorCode.TooManyGroups,
      `Maximum ${MAX_REPORT_GROUPS} groups allowed`,
    );
  }
  const maxAgg =
    chartType === "PIVOT_TABLE"
      ? MAX_PIVOT_TABLE_AGGREGATIONS
      : MAX_REPORT_AGGREGATIONS;
  if (aggregations.length > maxAgg) {
    throw new BusinessRuleError(
      AppErrorCode.TooManyAggregations,
      `Maximum ${maxAgg} aggregations allowed for ${chartType}`,
    );
  }
  if (chartType === "PIVOT_TABLE" && groups.length < 2) {
    throw new BusinessRuleError(
      AppErrorCode.PivotTableRequiresGroups,
      "PIVOT_TABLE requires at least 2 groups (major and medium category)",
    );
  }
}

// ============================================
// ProcessDefinition Entity
// ============================================

type _ProcessDefinition = Readonly<{
  appId: AppIdType;
  isEnabled: boolean;
  statuses: readonly ProcessStatusType[];
  transitions: readonly ProcessTransitionType[];
  revision: RevisionType;
}>;

export type ProcessDefinition = _ProcessDefinition;

export const ProcessDefinition = {
  create: (params: { appId: AppIdType }): _ProcessDefinition => ({
    appId: params.appId,
    isEnabled: false,
    statuses: [],
    transitions: [],
    revision: Revision.initial(),
  }),

  reconstruct: (data: _ProcessDefinition): _ProcessDefinition => data,

  enable: (definition: _ProcessDefinition): _ProcessDefinition => {
    if (definition.statuses.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.NoInitialStatus,
        "Cannot enable process management without at least one status",
      );
    }
    return { ...definition, isEnabled: true };
  },

  disable: (definition: _ProcessDefinition): _ProcessDefinition => {
    return { ...definition, isEnabled: false };
  },

  addStatus: (
    definition: _ProcessDefinition,
    name: string,
    insertAfter: ProcessStatusIdType | null,
  ): _ProcessDefinition => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyStatusName,
        "Status name cannot be empty",
      );
    }
    const newStatus = ProcessStatus.create({
      statusId: ProcessStatusId.generate(),
      name,
      index: definition.statuses.length,
    });
    let statuses: ProcessStatusType[];
    if (insertAfter === null) {
      statuses = [...definition.statuses, newStatus];
    } else {
      const afterIndex = definition.statuses.findIndex(
        (s) => s.statusId === insertAfter,
      );
      if (afterIndex < 0) {
        throw new BusinessRuleError(
          AppErrorCode.StatusNotFound,
          `Status ${insertAfter} not found`,
        );
      }
      statuses = [...definition.statuses];
      statuses.splice(afterIndex + 1, 0, newStatus);
    }
    statuses = statuses.map((s, i) => ({ ...s, index: i }));
    return { ...definition, statuses };
  },

  renameStatus: (
    definition: _ProcessDefinition,
    statusId: ProcessStatusIdType,
    name: string,
  ): _ProcessDefinition => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyStatusName,
        "Status name cannot be empty",
      );
    }
    const idx = definition.statuses.findIndex((s) => s.statusId === statusId);
    if (idx < 0) {
      throw new BusinessRuleError(
        AppErrorCode.StatusNotFound,
        `Status ${statusId} not found`,
      );
    }
    const statuses = [...definition.statuses];
    statuses[idx] = { ...statuses[idx], name };
    return { ...definition, statuses };
  },

  removeStatus: (
    definition: _ProcessDefinition,
    statusId: ProcessStatusIdType,
  ): _ProcessDefinition => {
    if (
      definition.statuses.length > 0 &&
      definition.statuses[0].statusId === statusId
    ) {
      throw new BusinessRuleError(
        AppErrorCode.InitialStatusDeletion,
        "Cannot delete the initial status",
      );
    }
    const isInUse = definition.transitions.some(
      (t) => t.fromStatusId === statusId || t.toStatusId === statusId,
    );
    if (isInUse) {
      throw new BusinessRuleError(
        AppErrorCode.StatusInUseByTransition,
        "Cannot delete a status that is referenced by transitions",
      );
    }
    let statuses = definition.statuses.filter((s) => s.statusId !== statusId);
    statuses = statuses.map((s, i) => ({ ...s, index: i }));
    return { ...definition, statuses };
  },

  reorderStatuses: (
    definition: _ProcessDefinition,
    order: readonly ProcessStatusIdType[],
  ): _ProcessDefinition => {
    if (
      definition.statuses.length > 0 &&
      order.length > 0 &&
      order[0] !== definition.statuses[0].statusId
    ) {
      throw new BusinessRuleError(
        AppErrorCode.InitialStatusReorder,
        "The initial status must remain first",
      );
    }
    const statusMap = new Map(definition.statuses.map((s) => [s.statusId, s]));
    const statuses = order.map((id, i) => {
      const s = statusMap.get(id);
      if (!s) {
        throw new BusinessRuleError(
          AppErrorCode.StatusNotFound,
          `Status ${id} not found`,
        );
      }
      return { ...s, index: i };
    });
    return { ...definition, statuses };
  },

  addTransition: (
    definition: _ProcessDefinition,
    input: ProcessTransitionInputType,
  ): _ProcessDefinition => {
    assertStatusExists(definition, input.fromStatusId);
    assertStatusExists(definition, input.toStatusId);
    const transition = ProcessTransition.create({
      transitionId: ProcessTransitionId.generate(),
      fromStatusId: input.fromStatusId,
      actionName: input.actionName,
      toStatusId: input.toStatusId,
      workers: input.workers,
      filterCondition: input.filterCondition,
      filterConditionType: input.filterConditionType,
    });
    return {
      ...definition,
      transitions: [...definition.transitions, transition],
    };
  },

  updateTransition: (
    definition: _ProcessDefinition,
    transitionId: ProcessTransitionIdType,
    input: ProcessTransitionInputType,
  ): _ProcessDefinition => {
    assertStatusExists(definition, input.fromStatusId);
    assertStatusExists(definition, input.toStatusId);
    const idx = definition.transitions.findIndex(
      (t) => t.transitionId === transitionId,
    );
    if (idx < 0) {
      throw new BusinessRuleError(
        AppErrorCode.TransitionNotFound,
        `Transition ${transitionId} not found`,
      );
    }
    const transitions = [...definition.transitions];
    transitions[idx] = ProcessTransition.create({
      transitionId,
      fromStatusId: input.fromStatusId,
      actionName: input.actionName,
      toStatusId: input.toStatusId,
      workers: input.workers,
      filterCondition: input.filterCondition,
      filterConditionType: input.filterConditionType,
    });
    return { ...definition, transitions };
  },

  removeTransition: (
    definition: _ProcessDefinition,
    transitionId: ProcessTransitionIdType,
  ): _ProcessDefinition => {
    const idx = definition.transitions.findIndex(
      (t) => t.transitionId === transitionId,
    );
    if (idx < 0) {
      throw new BusinessRuleError(
        AppErrorCode.TransitionNotFound,
        `Transition ${transitionId} not found`,
      );
    }
    const transitions = [...definition.transitions];
    transitions.splice(idx, 1);
    return { ...definition, transitions };
  },

  getTransitionsFromStatus: (
    definition: _ProcessDefinition,
    statusId: ProcessStatusIdType,
  ): readonly ProcessTransitionType[] => {
    return definition.transitions.filter((t) => t.fromStatusId === statusId);
  },

  isTerminalStatus: (
    definition: _ProcessDefinition,
    statusId: ProcessStatusIdType,
  ): boolean => {
    return !definition.transitions.some((t) => t.fromStatusId === statusId);
  },
};

function assertStatusExists(
  definition: _ProcessDefinition,
  statusId: ProcessStatusIdType,
): void {
  if (!definition.statuses.some((s) => s.statusId === statusId)) {
    throw new BusinessRuleError(
      AppErrorCode.StatusNotFound,
      `Status ${statusId} not found`,
    );
  }
}

// ============================================
// WebhookConfig Entity
// ============================================

type _WebhookConfig = Readonly<{
  webhookId: WebhookIdType;
  appId: AppIdType;
  url: WebhookUrlType;
  description: string;
  events: readonly WebhookEventType[];
  isActive: boolean;
}>;

export type WebhookConfig = _WebhookConfig;

export const WebhookConfig = {
  create: (params: {
    appId: AppIdType;
    url: WebhookUrlType;
    description?: string;
    events: readonly WebhookEventType[];
  }): _WebhookConfig => {
    if (params.events.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyWebhookEvents,
        "Webhook must have at least one event",
      );
    }
    return {
      webhookId: WebhookId.generate(),
      appId: params.appId,
      url: params.url,
      description: params.description ?? "",
      events: params.events,
      isActive: true,
    };
  },

  reconstruct: (data: _WebhookConfig): _WebhookConfig => data,

  setUrl: (config: _WebhookConfig, url: WebhookUrlType): _WebhookConfig => ({
    ...config,
    url,
  }),

  setDescription: (
    config: _WebhookConfig,
    description: string,
  ): _WebhookConfig => ({
    ...config,
    description,
  }),

  setEvents: (
    config: _WebhookConfig,
    events: readonly WebhookEventType[],
  ): _WebhookConfig => {
    if (events.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyWebhookEvents,
        "Webhook must have at least one event",
      );
    }
    return { ...config, events };
  },

  activate: (config: _WebhookConfig): _WebhookConfig => ({
    ...config,
    isActive: true,
  }),

  deactivate: (config: _WebhookConfig): _WebhookConfig => ({
    ...config,
    isActive: false,
  }),
};

// ============================================
// ApiTokenConfig Entity
// ============================================

type _ApiTokenConfig = Readonly<{
  tokenId: ApiTokenIdType;
  appId: AppIdType;
  tokenHash: string;
  scopes: readonly ApiScopeType[];
  memo: string;
}>;

export type ApiTokenConfig = _ApiTokenConfig;

export const ApiTokenConfig = {
  create: (params: {
    appId: AppIdType;
    tokenHash: string;
    scopes: readonly ApiScopeType[];
    memo?: string;
  }): _ApiTokenConfig => {
    if (params.scopes.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyApiScopes,
        "API token must have at least one scope",
      );
    }
    return {
      tokenId: ApiTokenId.generate(),
      appId: params.appId,
      tokenHash: params.tokenHash,
      scopes: params.scopes,
      memo: params.memo ?? "",
    };
  },

  reconstruct: (data: _ApiTokenConfig): _ApiTokenConfig => data,

  updateScopes: (
    config: _ApiTokenConfig,
    scopes: readonly ApiScopeType[],
  ): _ApiTokenConfig => {
    if (scopes.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyApiScopes,
        "API token must have at least one scope",
      );
    }
    return { ...config, scopes };
  },

  updateMemo: (config: _ApiTokenConfig, memo: string): _ApiTokenConfig => ({
    ...config,
    memo,
  }),

  regenerate: (
    config: _ApiTokenConfig,
    newTokenHash: string,
  ): _ApiTokenConfig => ({
    ...config,
    tokenHash: newTokenHash,
  }),
};

// ============================================
// AppNotificationConfig Entity
// ============================================

type _AppNotificationConfig = Readonly<{
  appId: AppIdType;
  generalNotifications: readonly GeneralNotificationType[];
  perRecordNotifications: readonly PerRecordNotificationType[];
  reminderNotifications: readonly ReminderNotificationType[];
  revision: RevisionType;
}>;

export type AppNotificationConfig = _AppNotificationConfig;

export const AppNotificationConfig = {
  create: (params: { appId: AppIdType }): _AppNotificationConfig => ({
    appId: params.appId,
    generalNotifications: [],
    perRecordNotifications: [],
    reminderNotifications: [],
    revision: Revision.initial(),
  }),

  reconstruct: (data: _AppNotificationConfig): _AppNotificationConfig => data,

  setGeneralNotifications: (
    config: _AppNotificationConfig,
    notifications: readonly GeneralNotificationType[],
  ): _AppNotificationConfig => ({
    ...config,
    generalNotifications: notifications,
  }),

  setPerRecordNotifications: (
    config: _AppNotificationConfig,
    notifications: readonly PerRecordNotificationType[],
  ): _AppNotificationConfig => ({
    ...config,
    perRecordNotifications: notifications,
  }),

  setReminderNotifications: (
    config: _AppNotificationConfig,
    notifications: readonly ReminderNotificationType[],
  ): _AppNotificationConfig => ({
    ...config,
    reminderNotifications: notifications,
  }),
};

// ============================================
// AppAction Entity
// ============================================

type _AppAction = Readonly<{
  actionId: AppActionIdType;
  appId: AppIdType;
  actionName: string;
  destinationAppId: AppIdType;
  fieldMappings: readonly ActionFieldMappingType[];
  allowedEntities: readonly ActionAllowedEntityType[];
  filterCondition: string | null;
  index: number;
}>;

export type AppAction = _AppAction;

export const AppAction = {
  create: (params: {
    appId: AppIdType;
    actionName: string;
    destinationAppId: AppIdType;
    fieldMappings?: readonly ActionFieldMappingType[];
    allowedEntities?: readonly ActionAllowedEntityType[];
    filterCondition?: string | null;
    index: number;
  }): _AppAction => {
    if (params.actionName.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyActionName,
        "Action name cannot be empty",
      );
    }
    if (params.index < 0) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidActionIndex,
        "Action index must be non-negative",
      );
    }
    return {
      actionId: AppActionId.generate(),
      appId: params.appId,
      actionName: params.actionName,
      destinationAppId: params.destinationAppId,
      fieldMappings: params.fieldMappings ?? [],
      allowedEntities: params.allowedEntities ?? [],
      filterCondition: params.filterCondition ?? null,
      index: params.index,
    };
  },

  reconstruct: (data: _AppAction): _AppAction => data,

  rename: (action: _AppAction, name: string): _AppAction => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyActionName,
        "Action name cannot be empty",
      );
    }
    return { ...action, actionName: name };
  },

  setDestination: (action: _AppAction, appId: AppIdType): _AppAction => ({
    ...action,
    destinationAppId: appId,
  }),

  setFieldMappings: (
    action: _AppAction,
    mappings: readonly ActionFieldMappingType[],
  ): _AppAction => ({
    ...action,
    fieldMappings: mappings,
  }),

  setAllowedEntities: (
    action: _AppAction,
    entities: readonly ActionAllowedEntityType[],
  ): _AppAction => ({
    ...action,
    allowedEntities: entities,
  }),

  setFilter: (action: _AppAction, condition: string | null): _AppAction => ({
    ...action,
    filterCondition: condition,
  }),

  reorder: (action: _AppAction, index: number): _AppAction => {
    if (index < 0) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidActionIndex,
        "Action index must be non-negative",
      );
    }
    return { ...action, index };
  },
};

// ============================================
// AppCustomization Entity
// ============================================

type _AppCustomization = Readonly<{
  appId: AppIdType;
  scope: CustomizationScopeType;
  desktop: PlatformCustomizationType;
  mobile: PlatformCustomizationType;
  revision: RevisionType;
}>;

export type AppCustomization = _AppCustomization;

export const AppCustomization = {
  create: (params: { appId: AppIdType }): _AppCustomization => ({
    appId: params.appId,
    scope: "NONE",
    desktop: PlatformCustomization.empty(),
    mobile: PlatformCustomization.empty(),
    revision: Revision.initial(),
  }),

  reconstruct: (data: _AppCustomization): _AppCustomization => data,

  setScope: (
    customization: _AppCustomization,
    scope: CustomizationScopeType,
  ): _AppCustomization => ({
    ...customization,
    scope,
  }),

  setDesktopJs: (
    customization: _AppCustomization,
    files: readonly CustomizationFileType[],
  ): _AppCustomization => ({
    ...customization,
    desktop: {
      ...customization.desktop,
      jsFiles: files,
    },
  }),

  setDesktopCss: (
    customization: _AppCustomization,
    files: readonly CustomizationFileType[],
  ): _AppCustomization => ({
    ...customization,
    desktop: {
      ...customization.desktop,
      cssFiles: files,
    },
  }),

  setMobileJs: (
    customization: _AppCustomization,
    files: readonly CustomizationFileType[],
  ): _AppCustomization => ({
    ...customization,
    mobile: {
      ...customization.mobile,
      jsFiles: files,
    },
  }),

  setMobileCss: (
    customization: _AppCustomization,
    files: readonly CustomizationFileType[],
  ): _AppCustomization => ({
    ...customization,
    mobile: {
      ...customization.mobile,
      cssFiles: files,
    },
  }),
};

// ============================================
// PluginConfig Entity
// ============================================

type _PluginConfig = Readonly<{
  pluginId: PluginIdType;
  appId: AppIdType;
  isActive: boolean;
  config: string;
}>;

export type PluginConfig = _PluginConfig;

export const PluginConfig = {
  create: (params: {
    pluginId: PluginIdType;
    appId: AppIdType;
    config?: string;
  }): _PluginConfig => {
    const config = params.config ?? "";
    if (new TextEncoder().encode(config).length > PLUGIN_CONFIG_MAX_SIZE) {
      throw new BusinessRuleError(
        AppErrorCode.PluginConfigTooLarge,
        "Plugin config exceeds maximum size of 256KB",
      );
    }
    return {
      pluginId: params.pluginId,
      appId: params.appId,
      isActive: true,
      config,
    };
  },

  reconstruct: (data: _PluginConfig): _PluginConfig => data,

  activate: (plugin: _PluginConfig): _PluginConfig => ({
    ...plugin,
    isActive: true,
  }),

  deactivate: (plugin: _PluginConfig): _PluginConfig => ({
    ...plugin,
    isActive: false,
  }),

  updateConfig: (plugin: _PluginConfig, config: string): _PluginConfig => {
    if (new TextEncoder().encode(config).length > PLUGIN_CONFIG_MAX_SIZE) {
      throw new BusinessRuleError(
        AppErrorCode.PluginConfigTooLarge,
        "Plugin config exceeds maximum size of 256KB",
      );
    }
    return { ...plugin, config };
  },
};

// ============================================
// AppCategory Entity
// ============================================

type _AppCategory = Readonly<{
  appId: AppIdType;
  isEnabled: boolean;
  categories: readonly CategoryNodeType[];
  revision: RevisionType;
}>;

export type AppCategory = _AppCategory;

export const AppCategory = {
  create: (params: { appId: AppIdType }): _AppCategory => ({
    appId: params.appId,
    isEnabled: false,
    categories: [],
    revision: Revision.initial(),
  }),

  reconstruct: (data: _AppCategory): _AppCategory => data,

  enable: (category: _AppCategory): _AppCategory => ({
    ...category,
    isEnabled: true,
  }),

  disable: (category: _AppCategory): _AppCategory => ({
    ...category,
    isEnabled: false,
  }),

  addCategory: (
    category: _AppCategory,
    name: string,
    parentId: CategoryIdType | null,
  ): { appCategory: _AppCategory; newCategoryId: CategoryIdType } => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyCategoryName,
        "Category name cannot be empty",
      );
    }
    const newId = CategoryId.generate();
    const newNode = CategoryNode.create({
      categoryId: newId,
      name,
      children: [],
    });
    if (parentId === null) {
      return {
        appCategory: {
          ...category,
          categories: [...category.categories, newNode],
        },
        newCategoryId: newId,
      };
    }
    const categories = addChildToNode(category.categories, parentId, newNode);
    if (categories === null) {
      throw new BusinessRuleError(
        AppErrorCode.CategoryNotFound,
        `Parent category ${parentId} not found`,
      );
    }
    return {
      appCategory: { ...category, categories },
      newCategoryId: newId,
    };
  },

  renameCategory: (
    category: _AppCategory,
    categoryId: CategoryIdType,
    name: string,
  ): _AppCategory => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        AppErrorCode.EmptyCategoryName,
        "Category name cannot be empty",
      );
    }
    const categories = renameCategoryNode(
      category.categories,
      categoryId,
      name,
    );
    if (categories === null) {
      throw new BusinessRuleError(
        AppErrorCode.CategoryNotFound,
        `Category ${categoryId} not found`,
      );
    }
    return { ...category, categories };
  },

  removeCategory: (
    category: _AppCategory,
    categoryId: CategoryIdType,
  ): _AppCategory => {
    const categories = removeCategoryNode(category.categories, categoryId);
    if (categories === null) {
      throw new BusinessRuleError(
        AppErrorCode.CategoryNotFound,
        `Category ${categoryId} not found`,
      );
    }
    return { ...category, categories };
  },

  moveCategory: (
    category: _AppCategory,
    categoryId: CategoryIdType,
    newParentId: CategoryIdType | null,
    index: number,
  ): _AppCategory => {
    const extracted = extractCategoryNode(category.categories, categoryId);
    if (extracted === null) {
      throw new BusinessRuleError(
        AppErrorCode.CategoryNotFound,
        `Category ${categoryId} not found`,
      );
    }
    const { node, remaining } = extracted;
    if (newParentId === null) {
      const cats = [...remaining];
      cats.splice(index, 0, node);
      return { ...category, categories: cats };
    }
    const inserted = insertChildToNode(remaining, newParentId, node, index);
    if (inserted === null) {
      throw new BusinessRuleError(
        AppErrorCode.CategoryNotFound,
        `Parent category ${newParentId} not found`,
      );
    }
    return { ...category, categories: inserted };
  },

  addChildCategory: (
    category: _AppCategory,
    parentId: CategoryIdType,
    name: string,
  ): { appCategory: _AppCategory; newCategoryId: CategoryIdType } => {
    return AppCategory.addCategory(category, name, parentId);
  },
};

// Category tree helpers

function addChildToNode(
  nodes: readonly CategoryNodeType[],
  parentId: CategoryIdType,
  child: CategoryNodeType,
): readonly CategoryNodeType[] | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].categoryId === parentId) {
      const updated = [
        ...nodes.slice(0, i),
        { ...nodes[i], children: [...nodes[i].children, child] },
        ...nodes.slice(i + 1),
      ];
      return updated;
    }
    const result = addChildToNode(nodes[i].children, parentId, child);
    if (result !== null) {
      return [
        ...nodes.slice(0, i),
        { ...nodes[i], children: result },
        ...nodes.slice(i + 1),
      ];
    }
  }
  return null;
}

function renameCategoryNode(
  nodes: readonly CategoryNodeType[],
  categoryId: CategoryIdType,
  name: string,
): readonly CategoryNodeType[] | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].categoryId === categoryId) {
      return [
        ...nodes.slice(0, i),
        { ...nodes[i], name },
        ...nodes.slice(i + 1),
      ];
    }
    const result = renameCategoryNode(nodes[i].children, categoryId, name);
    if (result !== null) {
      return [
        ...nodes.slice(0, i),
        { ...nodes[i], children: result },
        ...nodes.slice(i + 1),
      ];
    }
  }
  return null;
}

function removeCategoryNode(
  nodes: readonly CategoryNodeType[],
  categoryId: CategoryIdType,
): readonly CategoryNodeType[] | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].categoryId === categoryId) {
      return [...nodes.slice(0, i), ...nodes.slice(i + 1)];
    }
    const result = removeCategoryNode(nodes[i].children, categoryId);
    if (result !== null) {
      return [
        ...nodes.slice(0, i),
        { ...nodes[i], children: result },
        ...nodes.slice(i + 1),
      ];
    }
  }
  return null;
}

function extractCategoryNode(
  nodes: readonly CategoryNodeType[],
  categoryId: CategoryIdType,
): { node: CategoryNodeType; remaining: readonly CategoryNodeType[] } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].categoryId === categoryId) {
      return {
        node: nodes[i],
        remaining: [...nodes.slice(0, i), ...nodes.slice(i + 1)],
      };
    }
    const result = extractCategoryNode(nodes[i].children, categoryId);
    if (result !== null) {
      return {
        node: result.node,
        remaining: [
          ...nodes.slice(0, i),
          { ...nodes[i], children: result.remaining },
          ...nodes.slice(i + 1),
        ],
      };
    }
  }
  return null;
}

function insertChildToNode(
  nodes: readonly CategoryNodeType[],
  parentId: CategoryIdType,
  child: CategoryNodeType,
  index: number,
): readonly CategoryNodeType[] | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].categoryId === parentId) {
      const children = [...nodes[i].children];
      children.splice(index, 0, child);
      return [
        ...nodes.slice(0, i),
        { ...nodes[i], children },
        ...nodes.slice(i + 1),
      ];
    }
    const result = insertChildToNode(nodes[i].children, parentId, child, index);
    if (result !== null) {
      return [
        ...nodes.slice(0, i),
        { ...nodes[i], children: result },
        ...nodes.slice(i + 1),
      ];
    }
  }
  return null;
}

// ============================================
// AppI18nConfig Entity
// ============================================

type _AppI18nConfig = Readonly<{
  appId: AppIdType;
  translations: readonly I18nTranslationType[];
  revision: RevisionType;
}>;

export type AppI18nConfig = _AppI18nConfig;

export const AppI18nConfig = {
  create: (params: { appId: AppIdType }): _AppI18nConfig => ({
    appId: params.appId,
    translations: [],
    revision: Revision.initial(),
  }),

  reconstruct: (data: _AppI18nConfig): _AppI18nConfig => data,

  setTranslation: (
    config: _AppI18nConfig,
    scope: I18nScopeType,
    itemKey: string,
    language: AppLanguageType,
    value: string,
  ): _AppI18nConfig => {
    const idx = config.translations.findIndex(
      (t) => t.scope === scope && t.itemKey === itemKey,
    );
    if (idx >= 0) {
      const existing = config.translations[idx];
      const nameIdx = existing.localizedNames.findIndex(
        (n) => n.language === language,
      );
      let localizedNames: readonly LocalizedNameType[];
      if (nameIdx >= 0) {
        localizedNames = [
          ...existing.localizedNames.slice(0, nameIdx),
          LocalizedName.create(language, value),
          ...existing.localizedNames.slice(nameIdx + 1),
        ];
      } else {
        localizedNames = [
          ...existing.localizedNames,
          LocalizedName.create(language, value),
        ];
      }
      const translations = [
        ...config.translations.slice(0, idx),
        { ...existing, localizedNames },
        ...config.translations.slice(idx + 1),
      ];
      return { ...config, translations };
    }
    const translations = [
      ...config.translations,
      {
        scope,
        itemKey,
        localizedNames: [LocalizedName.create(language, value)],
      },
    ];
    return { ...config, translations };
  },

  removeTranslation: (
    config: _AppI18nConfig,
    scope: I18nScopeType,
    itemKey: string,
    language: AppLanguageType,
  ): _AppI18nConfig => {
    const idx = config.translations.findIndex(
      (t) => t.scope === scope && t.itemKey === itemKey,
    );
    if (idx < 0) {
      return config;
    }
    const existing = config.translations[idx];
    const localizedNames = existing.localizedNames.filter(
      (n) => n.language !== language,
    );
    if (localizedNames.length === 0) {
      const translations = [
        ...config.translations.slice(0, idx),
        ...config.translations.slice(idx + 1),
      ];
      return { ...config, translations };
    }
    const translations = [
      ...config.translations.slice(0, idx),
      { ...existing, localizedNames },
      ...config.translations.slice(idx + 1),
    ];
    return { ...config, translations };
  },

  getLocalizedName: (
    config: _AppI18nConfig,
    scope: I18nScopeType,
    itemKey: string,
    language: AppLanguageType,
  ): string | null => {
    const translation = config.translations.find(
      (t) => t.scope === scope && t.itemKey === itemKey,
    );
    if (!translation) {
      return null;
    }
    const localized = translation.localizedNames.find(
      (n) => n.language === language,
    );
    return localized?.value ?? null;
  },
};
