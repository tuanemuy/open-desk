import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";

// ============================================================
// 1. Identity ドメイン
// ============================================================

/**
 * users - ユーザーテーブル
 */
export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    loginName: text("login_name").notNull().unique(),
    displayName: text("display_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordAlgorithm: text("password_algorithm").notNull().default("bcrypt"),
    primaryOrganizationId: text("primary_organization_id").references(
      () => organizations.id,
      { onDelete: "set null" },
    ),
    timezone: text("timezone").notNull().default("Asia/Tokyo"),
    language: text("language").notNull().default("ja"),
    timeFormat: text("time_format").notNull().default("24h"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    avatarFileKey: text("avatar_file_key"),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: integer("locked_until", { mode: "timestamp" }),
    passwordChangedAt: integer("password_changed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_primary_organization_id").on(table.primaryOrganizationId),
    index("idx_users_is_active").on(table.isActive),
  ],
);

/**
 * organizations - 組織テーブル（ツリー構造）
 */
export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    parentOrganizationId: text("parent_organization_id").references(
      (): ReturnType<typeof text> => organizations.id,
      { onDelete: "restrict" },
    ),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_organizations_parent_id").on(table.parentOrganizationId),
  ],
);

/**
 * groups - グループテーブル
 */
export const groups = sqliteTable("groups", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * sessions - セッションテーブル
 */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent").notNull(),
    country: text("country"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_expires_at").on(table.expiresAt),
  ],
);

/**
 * userOrganizations - ユーザーと組織の多対多関係
 */
export const userOrganizations = sqliteTable(
  "user_organizations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_user_organizations").on(table.userId, table.organizationId),
    index("idx_user_organizations_user_id").on(table.userId),
    index("idx_user_organizations_organization_id").on(table.organizationId),
  ],
);

/**
 * userGroups - ユーザーとグループの多対多関係
 */
export const userGroups = sqliteTable(
  "user_groups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_user_groups").on(table.userId, table.groupId),
    index("idx_user_groups_user_id").on(table.userId),
    index("idx_user_groups_group_id").on(table.groupId),
  ],
);

/**
 * passwordHistories - パスワード履歴テーブル
 */
export const passwordHistories = sqliteTable(
  "password_histories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    passwordHash: text("password_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("idx_password_histories_user_id").on(table.userId)],
);

/**
 * loginHistories - ログイン履歴テーブル
 */
export const loginHistories = sqliteTable(
  "login_histories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address").notNull(),
    country: text("country"),
    userAgent: text("user_agent").notNull(),
    success: integer("success", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_login_histories_user_id_created_at").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

/**
 * systemSettings - システム設定テーブル
 */
export const systemSettings = sqliteTable("system_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  key: text("key").notNull().unique(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * titles - 役職テーブル
 */
export const titles = sqliteTable(
  "titles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull().unique(),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_titles_name").on(table.name),
    index("idx_titles_order_index").on(table.orderIndex),
  ],
);

/**
 * userTitles - ユーザーと役職の多対多関係
 */
export const userTitles = sqliteTable(
  "user_titles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    titleId: text("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_user_titles").on(table.userId, table.titleId),
    index("idx_user_titles_user_id").on(table.userId),
    index("idx_user_titles_title_id").on(table.titleId),
  ],
);

/**
 * provisioningConfigs - プロビジョニング設定テーブル（シングルトン）
 */
export const provisioningConfigs = sqliteTable("provisioning_configs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  isEnabled: integer("is_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  bearerTokenHash: text("bearer_token_hash"),
  bearerTokenAlgorithm: text("bearer_token_algorithm"),
  tokenIssuedAt: integer("token_issued_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * apiTokenRecords - APIトークンレコードテーブル
 */
export const apiTokenRecords = sqliteTable(
  "api_token_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    summary: text("summary").notNull(),
    scopes: text("scopes", { mode: "json" })
      .notNull()
      .$type<string[]>()
      .default([]),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_api_token_records_user_id").on(table.userId),
    index("idx_api_token_records_token_hash").on(table.tokenHash),
  ],
);

/**
 * scimExternalMappings - SCIM外部マッピングテーブル
 */
export const scimExternalMappings = sqliteTable(
  "scim_external_mappings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    externalId: text("external_id").notNull(),
    resourceType: text("resource_type").notNull(),
    internalId: text("internal_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_scim_external_mappings").on(
      table.externalId,
      table.resourceType,
    ),
    index("idx_scim_external_mappings_internal_id").on(table.internalId),
    index("idx_scim_external_mappings_resource_type").on(table.resourceType),
  ],
);

// ============================================================
// 2. App ドメイン
// ============================================================

/**
 * apps - アプリテーブル
 */
export const apps = sqliteTable(
  "apps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    code: text("code").unique(),
    name: text("name").notNull(),
    description: text("description"),
    spaceId: text("space_id"),
    threadId: text("thread_id"),
    theme: text("theme").notNull().default("WHITE"),
    icon: text("icon", { mode: "json" }).notNull().default({}),
    titleFieldConfig: text("title_field_config", { mode: "json" })
      .notNull()
      .default({}),
    enableThumbnails: integer("enable_thumbnails", { mode: "boolean" })
      .notNull()
      .default(false),
    enableBulkDeletion: integer("enable_bulk_deletion", { mode: "boolean" })
      .notNull()
      .default(false),
    enableRecordHistory: integer("enable_record_history", { mode: "boolean" })
      .notNull()
      .default(true),
    enableComments: integer("enable_comments", { mode: "boolean" })
      .notNull()
      .default(true),
    enableDuplicateRecord: integer("enable_duplicate_record", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
    enableInlineEditing: integer("enable_inline_editing", { mode: "boolean" })
      .notNull()
      .default(true),
    numberPrecision: text("number_precision", { mode: "json" })
      .notNull()
      .default({}),
    firstMonthOfFiscalYear: integer("first_month_of_fiscal_year")
      .notNull()
      .default(1),
    revision: integer("revision").notNull().default(0),
    status: text("status").notNull().default("PREVIEW"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    modifierId: text("modifier_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_apps_space_id").on(table.spaceId),
    index("idx_apps_status").on(table.status),
    index("idx_apps_creator_id").on(table.creatorId),
  ],
);

/**
 * fields - フィールドテーブル
 */
export const fields = sqliteTable(
  "fields",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    fieldCode: text("field_code").notNull(),
    label: text("label").notNull(),
    noLabel: integer("no_label", { mode: "boolean" }).notNull().default(false),
    fieldType: text("field_type").notNull(),
    required: integer("required", { mode: "boolean" }).notNull().default(false),
    isUnique: integer("is_unique", { mode: "boolean" })
      .notNull()
      .default(false),
    defaultValue: text("default_value", { mode: "json" }),
    properties: text("properties", { mode: "json" }).notNull().default({}),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_fields_app_id_field_code").on(table.appId, table.fieldCode),
    index("idx_fields_app_id").on(table.appId),
    index("idx_fields_field_type").on(table.fieldType),
  ],
);

/**
 * formLayouts - フォームレイアウトテーブル
 */
export const formLayouts = sqliteTable("form_layouts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  appId: text("app_id")
    .notNull()
    .unique()
    .references(() => apps.id, { onDelete: "cascade" }),
  rows: text("rows", { mode: "json" }).notNull().default([]),
  revision: integer("revision").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * views - ビューテーブル
 */
export const views = sqliteTable(
  "views",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    viewName: text("view_name").notNull(),
    viewType: text("view_type").notNull(),
    fields: text("fields", { mode: "json" }).notNull().default([]),
    calendarDateField: text("calendar_date_field"),
    calendarTitleField: text("calendar_title_field"),
    html: text("html"),
    pager: integer("pager", { mode: "boolean" }).notNull().default(true),
    deviceScope: text("device_scope"),
    filterCondition: text("filter_condition"),
    sort: text("sort", { mode: "json" }).notNull().default([]),
    index: integer("index").notNull().default(0),
    builtinType: text("builtin_type"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_views_app_id_view_name").on(table.appId, table.viewName),
    index("idx_views_app_id").on(table.appId),
  ],
);

/**
 * reports - レポートテーブル
 */
export const reports = sqliteTable(
  "reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    reportName: text("report_name").notNull(),
    chartType: text("chart_type").notNull(),
    chartSubType: text("chart_sub_type"),
    groups: text("groups", { mode: "json" }).notNull().default([]),
    aggregations: text("aggregations", { mode: "json" }).notNull().default([]),
    filterCondition: text("filter_condition"),
    sort: text("sort", { mode: "json" }).notNull().default([]),
    periodicReportConfig: text("periodic_report_config", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_reports_app_id").on(table.appId)],
);

/**
 * periodicReportSnapshots - 定期レポートスナップショットテーブル
 */
export const periodicReportSnapshots = sqliteTable(
  "periodic_report_snapshots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    reportId: text("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    snapshotData: text("snapshot_data", { mode: "json" }).notNull(),
    capturedAt: integer("captured_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_periodic_report_snapshots_report_id").on(table.reportId),
    index("idx_periodic_report_snapshots_captured_at").on(
      table.reportId,
      table.capturedAt,
    ),
  ],
);

/**
 * processDefinitions - プロセス管理定義テーブル
 */
export const processDefinitions = sqliteTable("process_definitions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  appId: text("app_id")
    .notNull()
    .unique()
    .references(() => apps.id, { onDelete: "cascade" }),
  isEnabled: integer("is_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  revision: integer("revision").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * processStatuses - プロセスステータステーブル
 */
export const processStatuses = sqliteTable(
  "process_statuses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    processDefinitionId: text("process_definition_id")
      .notNull()
      .references(() => processDefinitions.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_process_statuses_definition_id").on(table.processDefinitionId),
  ],
);

/**
 * processTransitions - プロセス遷移ルールテーブル
 */
export const processTransitions = sqliteTable(
  "process_transitions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    processDefinitionId: text("process_definition_id")
      .notNull()
      .references(() => processDefinitions.id, { onDelete: "cascade" }),
    fromStatusId: text("from_status_id")
      .notNull()
      .references(() => processStatuses.id, { onDelete: "cascade" }),
    actionName: text("action_name").notNull(),
    toStatusId: text("to_status_id")
      .notNull()
      .references(() => processStatuses.id, { onDelete: "cascade" }),
    assignees: text("assignees", { mode: "json" }).notNull().default([]),
    condition: text("condition"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_process_transitions_definition_id").on(
      table.processDefinitionId,
    ),
    index("idx_process_transitions_from_status").on(table.fromStatusId),
  ],
);

/**
 * webhookConfigs - Webhook設定テーブル
 */
export const webhookConfigs = sqliteTable(
  "webhook_configs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    description: text("description").notNull().default(""),
    events: text("events", { mode: "json" }).notNull().default([]),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_webhook_configs_app_id").on(table.appId)],
);

/**
 * apiTokenConfigs - APIトークン設定テーブル
 */
export const apiTokenConfigs = sqliteTable(
  "api_token_configs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    scopes: text("scopes", { mode: "json" }).notNull().default([]),
    memo: text("memo").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_api_token_configs_app_id").on(table.appId),
    index("idx_api_token_configs_token_hash").on(table.tokenHash),
  ],
);

/**
 * appNotificationConfigs - アプリ通知条件設定テーブル
 */
export const appNotificationConfigs = sqliteTable("app_notification_configs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  appId: text("app_id")
    .notNull()
    .unique()
    .references(() => apps.id, { onDelete: "cascade" }),
  generalNotifications: text("general_notifications", { mode: "json" })
    .notNull()
    .default([]),
  perRecordNotifications: text("per_record_notifications", { mode: "json" })
    .notNull()
    .default([]),
  reminderNotifications: text("reminder_notifications", { mode: "json" })
    .notNull()
    .default([]),
  revision: integer("revision").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * appActions - アクションテーブル
 */
export const appActions = sqliteTable(
  "app_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    actionName: text("action_name").notNull(),
    destinationAppId: text("destination_app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    fieldMappings: text("field_mappings", { mode: "json" })
      .notNull()
      .default([]),
    allowedEntities: text("allowed_entities", { mode: "json" })
      .notNull()
      .default([]),
    filterCondition: text("filter_condition"),
    index: integer("index").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_app_actions_app_id").on(table.appId)],
);

/**
 * appCustomizations - カスタマイズ設定テーブル
 */
export const appCustomizations = sqliteTable("app_customizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  appId: text("app_id")
    .notNull()
    .unique()
    .references(() => apps.id, { onDelete: "cascade" }),
  scope: text("scope").notNull().default("NONE"),
  desktop: text("desktop", { mode: "json" })
    .notNull()
    .default({ jsFiles: [], cssFiles: [] }),
  mobile: text("mobile", { mode: "json" })
    .notNull()
    .default({ jsFiles: [], cssFiles: [] }),
  revision: integer("revision").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * pluginConfigs - プラグイン設定テーブル
 */
export const pluginConfigs = sqliteTable(
  "plugin_configs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    config: text("config").notNull().default("{}"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_plugin_configs_app_id").on(table.appId)],
);

/**
 * appCategories - カテゴリー設定テーブル
 */
export const appCategories = sqliteTable("app_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  appId: text("app_id")
    .notNull()
    .unique()
    .references(() => apps.id, { onDelete: "cascade" }),
  isEnabled: integer("is_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  categories: text("categories", { mode: "json" }).notNull().default([]),
  revision: integer("revision").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * appI18nConfigs - 多言語名設定テーブル
 */
export const appI18nConfigs = sqliteTable("app_i18n_configs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  appId: text("app_id")
    .notNull()
    .unique()
    .references(() => apps.id, { onDelete: "cascade" }),
  translations: text("translations", { mode: "json" }).notNull().default([]),
  revision: integer("revision").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * appGroups - アプリグループテーブル
 */
export const appGroups = sqliteTable(
  "app_groups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_app_groups_is_default").on(table.isDefault)],
);

/**
 * appGroupApps - アプリグループとアプリの多対多関係
 */
export const appGroupApps = sqliteTable(
  "app_group_apps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appGroupId: text("app_group_id")
      .notNull()
      .references(() => appGroups.id, { onDelete: "cascade" }),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_app_group_apps").on(table.appGroupId, table.appId),
    index("idx_app_group_apps_app_group_id").on(table.appGroupId),
    index("idx_app_group_apps_app_id").on(table.appId),
  ],
);

/**
 * appTemplates - アプリテンプレートテーブル
 */
export const appTemplates = sqliteTable(
  "app_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    sourceAppId: text("source_app_id").references(() => apps.id, {
      onDelete: "set null",
    }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_app_templates_creator_id").on(table.creatorId),
    index("idx_app_templates_source_app_id").on(table.sourceAppId),
  ],
);

/**
 * plugins - プラグインテーブル（システム管理）
 */
export const plugins = sqliteTable(
  "plugins",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isPreinstalled: integer("is_preinstalled", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_plugins_is_active").on(table.isActive),
    index("idx_plugins_is_preinstalled").on(table.isPreinstalled),
  ],
);

/**
 * pluginApps - プラグインとアプリの多対多関係
 */
export const pluginApps = sqliteTable(
  "plugin_apps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    pluginId: text("plugin_id")
      .notNull()
      .references(() => plugins.id, { onDelete: "cascade" }),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_plugin_apps").on(table.pluginId, table.appId),
    index("idx_plugin_apps_plugin_id").on(table.pluginId),
    index("idx_plugin_apps_app_id").on(table.appId),
  ],
);

// ============================================================
// 3. Record ドメイン
// ============================================================

/**
 * records - レコードテーブル
 */
export const records = sqliteTable(
  "records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull().default(1),
    fieldValues: text("field_values", { mode: "json" }).notNull().default({}),
    status: text("status"),
    statusAssignees: text("status_assignees", { mode: "json" })
      .notNull()
      .default([]),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    modifierId: text("modifier_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_records_app_id").on(table.appId),
    index("idx_records_app_id_created_at").on(table.appId, table.createdAt),
    index("idx_records_creator_id").on(table.creatorId),
    index("idx_records_status").on(table.appId, table.status),
  ],
);

/**
 * recordComments - レコードコメントテーブル
 */
export const recordComments = sqliteTable(
  "record_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    mentions: text("mentions", { mode: "json" }).notNull().default([]),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_record_comments_record_id").on(table.recordId),
    index("idx_record_comments_app_id").on(table.appId),
    index("idx_record_comments_creator_id").on(table.creatorId),
  ],
);

/**
 * recordCommentLikes - レコードコメントいいねテーブル
 */
export const recordCommentLikes = sqliteTable(
  "record_comment_likes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    commentId: text("comment_id")
      .notNull()
      .references(() => recordComments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_record_comment_likes").on(table.commentId, table.userId),
    index("idx_record_comment_likes_comment_id").on(table.commentId),
  ],
);

/**
 * recordHistories - レコード変更履歴テーブル
 */
export const recordHistories = sqliteTable(
  "record_histories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    recordId: text("record_id")
      .notNull()
      .references(() => records.id, { onDelete: "cascade" }),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    changedFields: text("changed_fields", { mode: "json" })
      .notNull()
      .default([]),
    modifierId: text("modifier_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    modifiedAt: integer("modified_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_record_histories_record_version").on(
      table.recordId,
      table.version,
    ),
    index("idx_record_histories_record_id").on(table.recordId),
    index("idx_record_histories_app_id").on(table.appId),
  ],
);

/**
 * csvImportJobs - CSVインポートジョブテーブル
 */
export const csvImportJobs = sqliteTable(
  "csv_import_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    encoding: text("encoding").notNull().default("UTF-8"),
    delimiter: text("delimiter").notNull().default(","),
    importMode: text("import_mode").notNull(),
    updateKey: text("update_key"),
    errorHandling: text("error_handling").notNull().default("STOP"),
    fieldMappings: text("field_mappings", { mode: "json" })
      .notNull()
      .default([]),
    status: text("status").notNull().default("PENDING"),
    processedCount: integer("processed_count").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    errorDetails: text("error_details", { mode: "json" }).notNull().default([]),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_csv_import_jobs_app_id").on(table.appId),
    index("idx_csv_import_jobs_status").on(table.status),
  ],
);

/**
 * csvExportJobs - CSVエクスポートジョブテーブル
 */
export const csvExportJobs = sqliteTable(
  "csv_export_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    viewId: text("view_id"),
    encoding: text("encoding").notNull().default("UTF-8"),
    delimiter: text("delimiter").notNull().default(","),
    includeHeader: integer("include_header", { mode: "boolean" })
      .notNull()
      .default(true),
    exportFields: text("export_fields", { mode: "json" }).notNull(),
    includeComments: integer("include_comments", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status").notNull().default("PENDING"),
    outputFileName: text("output_file_name"),
    outputFileSize: integer("output_file_size"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_csv_export_jobs_app_id").on(table.appId),
    index("idx_csv_export_jobs_status").on(table.status),
  ],
);

// ============================================================
// 4. AccessControl ドメイン
// ============================================================

/**
 * appAclRules - アプリアクセス権テーブル
 */
export const appAclRules = sqliteTable(
  "app_acl_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    priority: integer("priority").notNull(),
    entityType: text("entity_type").notNull(),
    entityCode: text("entity_code"),
    includeSubs: integer("include_subs", { mode: "boolean" })
      .notNull()
      .default(false),
    appEditable: integer("app_editable", { mode: "boolean" })
      .notNull()
      .default(false),
    recordViewable: integer("record_viewable", { mode: "boolean" })
      .notNull()
      .default(false),
    recordAddable: integer("record_addable", { mode: "boolean" })
      .notNull()
      .default(false),
    recordEditable: integer("record_editable", { mode: "boolean" })
      .notNull()
      .default(false),
    recordDeletable: integer("record_deletable", { mode: "boolean" })
      .notNull()
      .default(false),
    recordImportable: integer("record_importable", { mode: "boolean" })
      .notNull()
      .default(false),
    recordExportable: integer("record_exportable", { mode: "boolean" })
      .notNull()
      .default(false),
    revision: integer("revision").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_app_acl_rules_app_entity").on(
      table.appId,
      table.entityType,
      table.entityCode,
    ),
    index("idx_app_acl_rules_app_id_priority").on(table.appId, table.priority),
  ],
);

/**
 * recordAclRules - レコードアクセス権テーブル
 */
export const recordAclRules = sqliteTable(
  "record_acl_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    ruleIndex: integer("rule_index").notNull(),
    filterCond: text("filter_cond"),
    entityType: text("entity_type").notNull(),
    entityCode: text("entity_code"),
    includeSubs: integer("include_subs", { mode: "boolean" })
      .notNull()
      .default(false),
    viewable: integer("viewable", { mode: "boolean" }).notNull().default(true),
    editable: integer("editable", { mode: "boolean" }).notNull().default(false),
    deletable: integer("deletable", { mode: "boolean" })
      .notNull()
      .default(false),
    entityPriority: integer("entity_priority").notNull().default(0),
    revision: integer("revision").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_record_acl_rules_app_id").on(
      table.appId,
      table.ruleIndex,
      table.entityPriority,
    ),
  ],
);

/**
 * fieldAclRules - フィールドアクセス権テーブル
 */
export const fieldAclRules = sqliteTable(
  "field_acl_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    fieldCode: text("field_code").notNull(),
    entityType: text("entity_type").notNull(),
    entityCode: text("entity_code"),
    includeSubs: integer("include_subs", { mode: "boolean" })
      .notNull()
      .default(false),
    accessibility: text("accessibility").notNull().default("WRITE"),
    entityPriority: integer("entity_priority").notNull().default(0),
    revision: integer("revision").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_field_acl_rules").on(
      table.appId,
      table.fieldCode,
      table.entityType,
      table.entityCode,
    ),
    index("idx_field_acl_rules_app_id_field").on(
      table.appId,
      table.fieldCode,
      table.entityPriority,
    ),
  ],
);

/**
 * systemPermissions - システム権限テーブル
 */
export const systemPermissions = sqliteTable(
  "system_permissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    entityType: text("entity_type").notNull(),
    entityCode: text("entity_code").notNull(),
    includeSubs: integer("include_subs", { mode: "boolean" })
      .notNull()
      .default(false),
    systemAdmin: integer("system_admin", { mode: "boolean" })
      .notNull()
      .default(false),
    appGroupViewable: integer("app_group_viewable", { mode: "boolean" })
      .notNull()
      .default(false),
    appGroupManageable: integer("app_group_manageable", { mode: "boolean" })
      .notNull()
      .default(false),
    appCreate: integer("app_create", { mode: "boolean" })
      .notNull()
      .default(false),
    appManage: integer("app_manage", { mode: "boolean" })
      .notNull()
      .default(false),
    spaceCreate: integer("space_create", { mode: "boolean" })
      .notNull()
      .default(false),
    guestSpaceCreate: integer("guest_space_create", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_system_permissions_entity").on(
      table.entityType,
      table.entityCode,
    ),
  ],
);

/**
 * orgAccessRules - 組織間アクセス権テーブル
 */
export const orgAccessRules = sqliteTable(
  "org_access_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    sourceOrganizationId: text("source_organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    targetOrganizationId: text("target_organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accessLevel: text("access_level").notNull().default("FULL"),
    isEnabled: integer("is_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_org_access_rules_pair").on(
      table.sourceOrganizationId,
      table.targetOrganizationId,
    ),
    index("idx_org_access_rules_source").on(table.sourceOrganizationId),
    index("idx_org_access_rules_target").on(table.targetOrganizationId),
    index("idx_org_access_rules_is_enabled").on(table.isEnabled),
  ],
);

// ============================================================
// 5. Space ドメイン
// ============================================================

/**
 * spaces - スペーステーブル
 *
 * 注意: spaces.defaultThreadId と threads.spaceId で循環参照が発生する。
 * defaultThreadId は nullable にし、挿入後に UPDATE で設定する。
 */
export const spaces = sqliteTable(
  "spaces",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    isPrivate: integer("is_private", { mode: "boolean" })
      .notNull()
      .default(false),
    isGuest: integer("is_guest", { mode: "boolean" }).notNull().default(false),
    useMultiThread: integer("use_multi_thread", { mode: "boolean" })
      .notNull()
      .default(false),
    fixedMember: integer("fixed_member", { mode: "boolean" })
      .notNull()
      .default(false),
    coverImage: text("cover_image", { mode: "json" })
      .notNull()
      .default({ type: "PRESET", key: "default" }),
    portalDisplay: text("portal_display", { mode: "json" }).notNull().default({
      showAnnouncement: true,
      showThreadList: true,
      showAppList: true,
      showMemberList: true,
      showRelatedLinkList: true,
    }),
    appCreationPermission: text("app_creation_permission")
      .notNull()
      .default("EVERYONE"),
    defaultThreadId: text("default_thread_id"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_spaces_creator_id").on(table.creatorId),
    index("idx_spaces_is_guest").on(table.isGuest),
  ],
);

/**
 * threads - スレッドテーブル
 */
export const threads = sqliteTable(
  "threads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body"),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(false),
    notifyOnCreate: integer("notify_on_create", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_threads_space_id").on(table.spaceId)],
);

/**
 * threadComments - スレッドコメントテーブル
 */
export const threadComments = sqliteTable(
  "thread_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    text: text("text"),
    mentions: text("mentions", { mode: "json" }).notNull().default([]),
    files: text("files", { mode: "json" }).notNull().default([]),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_thread_comments_thread_id").on(table.threadId),
    index("idx_thread_comments_space_id").on(table.spaceId),
    index("idx_thread_comments_creator_id").on(table.creatorId),
  ],
);

/**
 * threadCommentLikes - スレッドコメントいいねテーブル
 */
export const threadCommentLikes = sqliteTable(
  "thread_comment_likes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    commentId: text("comment_id")
      .notNull()
      .references(() => threadComments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_thread_comment_likes").on(table.commentId, table.userId),
    index("idx_thread_comment_likes_comment_id").on(table.commentId),
  ],
);

/**
 * spaceAnnouncements - スペースお知らせテーブル
 */
export const spaceAnnouncements = sqliteTable("space_announcements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  spaceId: text("space_id")
    .notNull()
    .unique()
    .references(() => spaces.id, { onDelete: "cascade" }),
  body: text("body").notNull().default(""),
  updatedBy: text("updated_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * spaceMembers - スペースメンバーテーブル
 */
export const spaceMembers = sqliteTable(
  "space_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    entityCode: text("entity_code").notNull(),
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    includeSubs: integer("include_subs", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_space_members").on(
      table.spaceId,
      table.entityType,
      table.entityId,
    ),
    index("idx_space_members_space_id").on(table.spaceId),
    index("idx_space_members_entity").on(table.entityType, table.entityId),
  ],
);

/**
 * spaceRelatedLinks - スペース関連リンクテーブル
 */
export const spaceRelatedLinks = sqliteTable(
  "space_related_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("idx_space_related_links_space_id").on(table.spaceId)],
);

/**
 * spaceTemplates - スペーステンプレートテーブル
 */
export const spaceTemplates = sqliteTable("space_templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: text("name").notNull(),
  sourceSpaceId: text("source_space_id")
    .notNull()
    .references(() => spaces.id, { onDelete: "restrict" }),
  useMultiThread: integer("use_multi_thread", { mode: "boolean" })
    .notNull()
    .default(false),
  fixedMember: integer("fixed_member", { mode: "boolean" })
    .notNull()
    .default(false),
  appCreationPermission: text("app_creation_permission")
    .notNull()
    .default("EVERYONE"),
  coverImage: text("cover_image", { mode: "json" }).notNull().default({}),
  portalDisplay: text("portal_display", { mode: "json" }).notNull().default({}),
  threadNames: text("thread_names", { mode: "json" }).notNull().default([]),
  appIds: text("app_ids", { mode: "json" }).notNull().default([]),
  relatedLinks: text("related_links", { mode: "json" }).notNull().default([]),
  announcementBody: text("announcement_body"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * threadFollows - スレッドフォローテーブル
 */
export const threadFollows = sqliteTable(
  "thread_follows",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_thread_follows").on(table.threadId, table.userId),
    index("idx_thread_follows_thread_id").on(table.threadId),
    index("idx_thread_follows_user_id").on(table.userId),
  ],
);

/**
 * threadActions - スレッドアクションテーブル
 */
export const threadActions = sqliteTable(
  "thread_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    actionName: text("action_name").notNull(),
    destinationAppId: text("destination_app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    fieldMappings: text("field_mappings", { mode: "json" })
      .notNull()
      .default([]),
    modifierId: text("modifier_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    modifiedAt: integer("modified_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_thread_actions_destination_app_id").on(table.destinationAppId),
    index("idx_thread_actions_modifier_id").on(table.modifierId),
  ],
);

// ============================================================
// 6. Notification ドメイン
// ============================================================

/**
 * notifications - 通知テーブル
 */
export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    senderId: text("sender_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    isReadLater: integer("is_read_later", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_notifications_recipient_id_created_at").on(
      table.recipientId,
      table.createdAt,
    ),
    index("idx_notifications_recipient_is_read").on(
      table.recipientId,
      table.isRead,
    ),
    index("idx_notifications_recipient_read_later").on(
      table.recipientId,
      table.isReadLater,
    ),
    index("idx_notifications_source").on(table.sourceType, table.sourceId),
  ],
);

/**
 * notificationFilters - 通知フィルタテーブル
 */
export const notificationFilters = sqliteTable(
  "notification_filters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isBuiltIn: integer("is_built_in", { mode: "boolean" })
      .notNull()
      .default(false),
    name: text("name").notNull(),
    notificationType: text("notification_type").notNull().default("ALL"),
    locationMode: text("location_mode").notNull().default("ALL"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_notification_filters_user_id").on(table.userId)],
);

/**
 * notificationFilterLocationConditions - 通知フィルタ場所条件テーブル
 */
export const notificationFilterLocationConditions = sqliteTable(
  "notification_filter_location_conditions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    filterId: text("filter_id")
      .notNull()
      .references(() => notificationFilters.id, { onDelete: "cascade" }),
    locationType: text("location_type").notNull(),
    locationId: text("location_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("idx_nf_location_conditions_filter_id").on(table.filterId)],
);

/**
 * notificationFilterSenderConditions - 通知フィルタ送信者条件テーブル
 */
export const notificationFilterSenderConditions = sqliteTable(
  "notification_filter_sender_conditions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    filterId: text("filter_id")
      .notNull()
      .references(() => notificationFilters.id, { onDelete: "cascade" }),
    senderType: text("sender_type").notNull(),
    senderId: text("sender_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_nf_sender_conditions").on(
      table.filterId,
      table.senderType,
      table.senderId,
    ),
    index("idx_nf_sender_conditions_filter_id").on(table.filterId),
  ],
);

/**
 * notificationPreferences - 通知設定テーブル
 */
export const notificationPreferences = sqliteTable("notification_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  emailEnabled: integer("email_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  emailScope: text("email_scope").notNull().default("MENTION_ONLY"),
  emailFormat: text("email_format").notNull().default("HTML"),
  desktopEnabled: integer("desktop_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * pushSubscriptions - Web Push サブスクリプションテーブル
 */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    keyP256dh: text("key_p256dh").notNull(),
    keyAuth: text("key_auth").notNull(),
    expirationTime: integer("expiration_time"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_push_subscriptions_user_id").on(table.userId),
    uniqueIndex("uq_push_subscriptions_endpoint").on(table.endpoint),
  ],
);

// ============================================================
// 7. Portal ドメイン
// ============================================================

/**
 * portalAnnouncements - ポータルお知らせ掲示板テーブル（シングルトン）
 */
export const portalAnnouncements = sqliteTable("portal_announcements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  title: text("title").notNull().default("お知らせ"),
  body: text("body").notNull().default(""),
  attachmentFileKeys: text("attachment_file_keys", { mode: "json" })
    .notNull()
    .default([]),
  lastUpdatedBy: text("last_updated_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// ============================================================
// 8. People ドメイン
// ============================================================

/**
 * profiles - プロフィールテーブル
 */
export const profiles = sqliteTable("profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  coverImageFileKey: text("cover_image_file_key"),
  comment: text("comment").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * posts - 投稿テーブル
 */
export const posts = sqliteTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    attachmentFileKeys: text("attachment_file_keys", { mode: "json" })
      .notNull()
      .default([]),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_posts_author_id_created_at").on(table.authorId, table.createdAt),
  ],
);

/**
 * postMentions - 投稿メンションテーブル
 */
export const postMentions = sqliteTable(
  "post_mentions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    mentionType: text("mention_type").notNull(),
    targetId: text("target_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_post_mentions_post_id").on(table.postId),
    index("idx_post_mentions_target").on(table.mentionType, table.targetId),
  ],
);

/**
 * follows - フォロー関係テーブル
 */
export const follows = sqliteTable(
  "follows",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followeeId: text("followee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_follows").on(table.followerId, table.followeeId),
    index("idx_follows_follower_id").on(table.followerId),
    index("idx_follows_followee_id").on(table.followeeId),
  ],
);

// ============================================================
// 9. Message ドメイン
// ============================================================

/**
 * messageThreads - メッセージスレッドテーブル
 */
export const messageThreads = sqliteTable(
  "message_threads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    participant1Id: text("participant_1_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    participant2Id: text("participant_2_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_message_threads_participants").on(
      table.participant1Id,
      table.participant2Id,
    ),
    index("idx_message_threads_participant_1").on(
      table.participant1Id,
      table.lastMessageAt,
    ),
    index("idx_message_threads_participant_2").on(
      table.participant2Id,
      table.lastMessageAt,
    ),
  ],
);

/**
 * directMessages - ダイレクトメッセージテーブル
 */
export const directMessages = sqliteTable(
  "direct_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    threadId: text("thread_id")
      .notNull()
      .references(() => messageThreads.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    content: text("content").notNull(),
    attachmentFileKeys: text("attachment_file_keys", { mode: "json" })
      .notNull()
      .default([]),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_direct_messages_thread_id_created_at").on(
      table.threadId,
      table.createdAt,
    ),
    index("idx_direct_messages_sender_id").on(table.senderId),
  ],
);

// ============================================================
// 10. File ドメイン
// ============================================================

/**
 * storedFiles - 保管ファイルテーブル
 */
export const storedFiles = sqliteTable(
  "stored_files",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    fileKey: text("file_key").notNull().unique(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("TEMPORARY"),
    uploadedAt: integer("uploaded_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_stored_files_uploader_id").on(table.uploaderId),
    index("idx_stored_files_status").on(table.status),
    index("idx_stored_files_expires_at").on(table.expiresAt),
  ],
);

// ============================================================
// 11. Bookmark ドメイン
// ============================================================

/**
 * bookmarks - ブックマークテーブル
 */
export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    category: text("category").notNull(),
    appId: text("app_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_bookmarks_user_id_created_at").on(table.userId, table.createdAt),
    index("idx_bookmarks_user_id_category").on(table.userId, table.category),
  ],
);

// ============================================================
// 13. Audit ドメイン
// ============================================================

/**
 * auditLogs - 監査ログテーブル
 */
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    level: text("level").notNull(),
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
    sourceIp: text("source_ip"),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    service: text("service").notNull(),
    module: text("module").notNull(),
    action: text("action").notNull(),
    result: text("result").notNull(),
    errorCode: text("error_code"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("idx_audit_logs_timestamp").on(table.timestamp),
    index("idx_audit_logs_level").on(table.level),
    index("idx_audit_logs_user_id").on(table.userId),
    index("idx_audit_logs_service").on(table.service),
    index("idx_audit_logs_result").on(table.result),
    index("idx_audit_logs_timestamp_level").on(table.timestamp, table.level),
  ],
);

/**
 * auditLogSettings - 監査ログ設定テーブル（シングルトン）
 */
export const auditLogSettings = sqliteTable("audit_log_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  settings: text("settings", { mode: "json" }).notNull().default({}),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

/**
 * userAccessUsages - ユーザーアクセス状況テーブル
 */
export const userAccessUsages = sqliteTable(
  "user_access_usages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    lastAccessDate: integer("last_access_date", { mode: "timestamp" }),
    accessDaysLast30: integer("access_days_last_30").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_user_access_usages_last_access_date").on(table.lastAccessDate),
    index("idx_user_access_usages_access_days").on(table.accessDaysLast30),
  ],
);

/**
 * userAccessDates - ユーザーアクセス日付テーブル
 */
export const userAccessDates = sqliteTable(
  "user_access_dates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessDate: integer("access_date", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("uq_user_access_dates").on(table.userId, table.accessDate),
    index("idx_user_access_dates_user_id_date").on(
      table.userId,
      table.accessDate,
    ),
    index("idx_user_access_dates_access_date").on(table.accessDate),
  ],
);

// ============================================================
// 12. Common ドメイン
// ============================================================

/**
 * eventOutbox - イベントアウトボックステーブル（Outbox パターン）
 */
export const eventOutbox = sqliteTable(
  "event_outbox",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    eventPayload: text("event_payload").notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    processedAt: integer("processed_at", { mode: "timestamp" }),
  },
  (table) => [index("idx_event_outbox_pending").on(table.processedAt)],
);
