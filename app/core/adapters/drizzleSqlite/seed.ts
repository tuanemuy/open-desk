/**
 * Seed script for manual testing environment.
 *
 * Creates:
 * - 3 users (admin, testuser, disabled)
 * - "Everyone" group and admin user membership
 * - System permissions (Everyone: appCreate, spaceCreate, guestSpaceCreate)
 * - 顧客リスト app (LIVE status, app ID compatible with test docs)
 * - App permissions for Everyone
 * - Sample records for CSV export tests
 */

import "dotenv/config";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { eq, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { getDatabaseAsync } from "./client";
import {
  apps,
  fields,
  formLayouts,
  groups,
  records,
  systemSettings,
  systemPermissions,
  userGroups,
  users,
  views,
} from "./schema";

const scryptAsync = promisify(scrypt);

const ALGORITHM = "scrypt";
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

async function hashPassword(
  password: string,
): Promise<{ value: string; algorithm: string }> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const hashValue = `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
  return { value: hashValue, algorithm: ALGORITHM };
}

async function main() {
  const url = process.env.SQLITE_URL;
  if (!url) {
    throw new Error("SQLITE_URL environment variable is not set.");
  }

  const db = await getDatabaseAsync(url);
  console.log("Connected to database.");

  // ----------------------------------------------------------------
  // 1. Hash passwords
  // ----------------------------------------------------------------
  console.log("Hashing passwords...");
  const adminHash = await hashPassword("Admin123!");
  const testUserHash = await hashPassword("TestPass123!");
  const disabledUserHash = await hashPassword("TestPass123!");

  // ----------------------------------------------------------------
  // 2. Insert users
  // ----------------------------------------------------------------
  console.log("Inserting users...");

  const userSeeds = [
    {
      id: uuidv7(),
      loginName: "admin",
      displayName: "Admin User",
      email: "admin@example.com",
      passwordHash: adminHash.value,
      passwordAlgorithm: adminHash.algorithm,
      isActive: true,
    },
    {
      id: uuidv7(),
      loginName: "testuser@example.cybozu.com",
      displayName: "Test User",
      email: "testuser@example.cybozu.com",
      passwordHash: testUserHash.value,
      passwordAlgorithm: testUserHash.algorithm,
      isActive: true,
    },
    {
      id: uuidv7(),
      loginName: "disabled@example.cybozu.com",
      displayName: "Disabled User",
      email: "disabled@example.cybozu.com",
      passwordHash: disabledUserHash.value,
      passwordAlgorithm: disabledUserHash.algorithm,
      isActive: false,
    },
  ] as const;

  for (const userSeed of userSeeds) {
    await db.insert(users).values(userSeed).onConflictDoUpdate({
      target: users.loginName,
      set: {
        displayName: userSeed.displayName,
        email: userSeed.email,
        passwordHash: userSeed.passwordHash,
        passwordAlgorithm: userSeed.passwordAlgorithm,
        isActive: userSeed.isActive,
      },
    });
  }

  const [adminUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.loginName, "admin"))
    .limit(1);
  const [testUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.loginName, "testuser@example.cybozu.com"))
    .limit(1);
  const [disabledUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.loginName, "disabled@example.cybozu.com"))
    .limit(1);

  if (!adminUser || !testUser || !disabledUser) {
    throw new Error("Failed to resolve seeded users.");
  }

  const adminId = adminUser.id;
  const testUserId = testUser.id;
  const disabledUserId = disabledUser.id;

  console.log(
    `  - admin (${adminId})\n  - testuser@example.cybozu.com (${testUserId})\n  - disabled@example.cybozu.com (${disabledUserId})`,
  );

  // ----------------------------------------------------------------
  // 3. Insert "Everyone" group
  // ----------------------------------------------------------------
  console.log("Inserting groups...");

  await db
    .insert(groups)
    .values([
      {
        id: uuidv7(),
        name: "Everyone",
        code: "everyone",
      },
    ])
    .onConflictDoUpdate({
      target: groups.code,
      set: {
        name: "Everyone",
      },
    });

  const [everyoneGroup] = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.code, "everyone"))
    .limit(1);

  if (!everyoneGroup) {
    throw new Error('Failed to resolve seeded "Everyone" group.');
  }

  const everyoneGroupId = everyoneGroup.id;

  // Add admin and testuser to Everyone group
  await db
    .insert(userGroups)
    .values([
      {
        id: uuidv7(),
        userId: adminId,
        groupId: everyoneGroupId,
      },
      {
        id: uuidv7(),
        userId: testUserId,
        groupId: everyoneGroupId,
      },
    ])
    .onConflictDoNothing();

  console.log(
    `  - Everyone group (${everyoneGroupId}), admin + testuser added`,
  );

  // ----------------------------------------------------------------
  // 4. System permissions for Everyone
  // ----------------------------------------------------------------
  console.log("Inserting system permissions...");

  const everyonePermissions = {
    id: uuidv7(),
    entityType: "GROUP",
    entityCode: "everyone",
    includeSubs: false,
    systemAdmin: false,
    appGroupViewable: true,
    appGroupManageable: false,
    appCreate: true,
    appManage: false,
    spaceCreate: true,
    guestSpaceCreate: true,
  } as const;
  await db
    .insert(systemPermissions)
    .values(everyonePermissions)
    .onConflictDoUpdate({
      target: [systemPermissions.entityType, systemPermissions.entityCode],
      set: {
        includeSubs: everyonePermissions.includeSubs,
        systemAdmin: everyonePermissions.systemAdmin,
        appGroupViewable: everyonePermissions.appGroupViewable,
        appGroupManageable: everyonePermissions.appGroupManageable,
        appCreate: everyonePermissions.appCreate,
        appManage: everyonePermissions.appManage,
        spaceCreate: everyonePermissions.spaceCreate,
        guestSpaceCreate: everyonePermissions.guestSpaceCreate,
      },
    });

  const adminPermissions = {
      id: uuidv7(),
      entityType: "USER",
      entityCode: "admin",
      includeSubs: false,
      systemAdmin: true,
      appGroupViewable: true,
      appGroupManageable: true,
      appCreate: true,
      appManage: true,
      spaceCreate: true,
      guestSpaceCreate: true,
    } as const;
  await db
    .insert(systemPermissions)
    .values(adminPermissions)
    .onConflictDoUpdate({
      target: [systemPermissions.entityType, systemPermissions.entityCode],
      set: {
        includeSubs: adminPermissions.includeSubs,
        systemAdmin: adminPermissions.systemAdmin,
        appGroupViewable: adminPermissions.appGroupViewable,
        appGroupManageable: adminPermissions.appGroupManageable,
        appCreate: adminPermissions.appCreate,
        appManage: adminPermissions.appManage,
        spaceCreate: adminPermissions.spaceCreate,
        guestSpaceCreate: adminPermissions.guestSpaceCreate,
      },
    });

  console.log("  - Everyone: appCreate, spaceCreate, guestSpaceCreate");
  console.log("  - admin: systemAdmin + all permissions");

  // ----------------------------------------------------------------
  // 5. Seed login-related system settings
  // ----------------------------------------------------------------
  console.log("Seeding system settings...");

  const settingsSeeds = [
    {
      id: uuidv7(),
      key: "password_policy" as const,
      value: {
        userMinLength: 8,
        adminMinLength: 10,
        complexity: "ALPHANUMERIC",
        allowSameAsLoginName: false,
        expirationDays: 90,
        historyCount: 3,
        allowUserChange: true,
        requireChangeOnNextLogin: false,
        allowUserReset: true,
      },
    },
    {
      id: uuidv7(),
      key: "lockout_policy" as const,
      value: {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 30,
        failedLoginMessage: { ja: "ログインに失敗しました" },
      },
    },
    {
      id: uuidv7(),
      key: "session_policy" as const,
      value: {
        sessionLifetimeMinutes: 480,
        allowAutoComplete: true,
        allowBrowserSave: true,
        allowAutoLogin: false,
        autoLoginExpiration: null,
        allowMismatchedApiAuth: false,
      },
    },
    {
      id: uuidv7(),
      key: "saml_auth" as const,
      value: {
        enabled: false,
      },
    },
    {
      id: uuidv7(),
      key: "two_factor_auth" as const,
      value: {
        enabled: true,
      },
    },
  ];

  for (const settingSeed of settingsSeeds) {
    await db.insert(systemSettings).values(settingSeed).onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: settingSeed.value,
      },
    });
  }

  console.log("  - login security settings seeded");

  // ----------------------------------------------------------------
  // 6. Create 顧客リスト app
  // ----------------------------------------------------------------
  console.log("Creating 顧客リスト app...");

  const [existingCustomerApp] = await db
    .select({ id: apps.id })
    .from(apps)
    .where(eq(apps.name, "顧客リスト"))
    .limit(1);

  const customerAppId = existingCustomerApp?.id ?? uuidv7();

  if (!existingCustomerApp) {
    await db.insert(apps).values([
      {
        id: customerAppId,
        code: "manual-test-customer-list",
        name: "顧客リスト",
        description: "顧客情報を管理するアプリ",
        theme: "WHITE",
        icon: {},
        titleFieldConfig: {},
        enableThumbnails: false,
        enableBulkDeletion: false,
        enableRecordHistory: true,
        enableComments: true,
        enableDuplicateRecord: true,
        enableInlineEditing: true,
        numberPrecision: {},
        firstMonthOfFiscalYear: 1,
        revision: 1,
        status: "LIVE",
        creatorId: adminId,
        modifierId: adminId,
      },
    ]);
  }

  console.log(`  - 顧客リスト app created (${customerAppId})`);

  // ----------------------------------------------------------------
  // 7. Create fields for 顧客リスト
  // ----------------------------------------------------------------
  console.log("Creating fields for 顧客リスト...");

  const companyFieldId = uuidv7();
  const departmentFieldId = uuidv7();
  const contactFieldId = uuidv7();
  const postalFieldId = uuidv7();
  const telFieldId = uuidv7();
  const faxFieldId = uuidv7();
  const addressFieldId = uuidv7();
  const rankFieldId = uuidv7();
  const emailFieldId = uuidv7();
  const notesFieldId = uuidv7();

  const fieldRows = [
    {
      id: companyFieldId,
      appId: customerAppId,
      fieldCode: "company_name",
      label: "会社名",
      noLabel: false,
      fieldType: "SINGLE_LINE_TEXT",
      required: false,
      isUnique: false,
      properties: {
        type: "SINGLE_LINE_TEXT",
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: null,
      },
    },
    {
      id: departmentFieldId,
      appId: customerAppId,
      fieldCode: "department",
      label: "部署名",
      noLabel: false,
      fieldType: "SINGLE_LINE_TEXT",
      required: false,
      isUnique: false,
      properties: {
        type: "SINGLE_LINE_TEXT",
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: null,
      },
    },
    {
      id: contactFieldId,
      appId: customerAppId,
      fieldCode: "contact_name",
      label: "担当者名",
      noLabel: false,
      fieldType: "SINGLE_LINE_TEXT",
      required: false,
      isUnique: false,
      properties: {
        type: "SINGLE_LINE_TEXT",
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: null,
      },
    },
    {
      id: postalFieldId,
      appId: customerAppId,
      fieldCode: "postal_code",
      label: "郵便番号(数字のみ)",
      noLabel: false,
      fieldType: "SINGLE_LINE_TEXT",
      required: false,
      isUnique: false,
      properties: {
        type: "SINGLE_LINE_TEXT",
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: 7,
      },
    },
    {
      id: telFieldId,
      appId: customerAppId,
      fieldCode: "tel",
      label: "TEL(数字のみ)",
      noLabel: false,
      fieldType: "SINGLE_LINE_TEXT",
      required: false,
      isUnique: false,
      properties: {
        type: "SINGLE_LINE_TEXT",
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: null,
      },
    },
    {
      id: faxFieldId,
      appId: customerAppId,
      fieldCode: "fax",
      label: "FAX(数字のみ)",
      noLabel: false,
      fieldType: "SINGLE_LINE_TEXT",
      required: false,
      isUnique: false,
      properties: {
        type: "SINGLE_LINE_TEXT",
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: null,
      },
    },
    {
      id: addressFieldId,
      appId: customerAppId,
      fieldCode: "address",
      label: "住所",
      noLabel: false,
      fieldType: "SINGLE_LINE_TEXT",
      required: false,
      isUnique: false,
      properties: {
        type: "SINGLE_LINE_TEXT",
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: null,
      },
    },
    {
      id: rankFieldId,
      appId: customerAppId,
      fieldCode: "customer_rank",
      label: "顧客ランク",
      noLabel: false,
      fieldType: "DROP_DOWN",
      required: false,
      isUnique: false,
      properties: {
        type: "DROP_DOWN",
        options: [
          { label: "A", index: 0 },
          { label: "B", index: 1 },
          { label: "C", index: 2 },
          { label: "D", index: 3 },
        ],
      },
    },
    {
      id: emailFieldId,
      appId: customerAppId,
      fieldCode: "email",
      label: "メールアドレス",
      noLabel: false,
      fieldType: "SINGLE_LINE_TEXT",
      required: false,
      isUnique: false,
      properties: {
        type: "SINGLE_LINE_TEXT",
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: null,
      },
    },
    {
      id: notesFieldId,
      appId: customerAppId,
      fieldCode: "notes",
      label: "備考",
      noLabel: false,
      fieldType: "MULTI_LINE_TEXT",
      required: false,
      isUnique: false,
      properties: {
        type: "MULTI_LINE_TEXT",
      },
    },
  ];

  for (const fieldRow of fieldRows) {
    await db.insert(fields).values(fieldRow).onConflictDoUpdate({
      target: [fields.appId, fields.fieldCode],
      set: {
        label: fieldRow.label,
        noLabel: fieldRow.noLabel,
        fieldType: fieldRow.fieldType,
        required: fieldRow.required,
        isUnique: fieldRow.isUnique,
        properties: fieldRow.properties,
      },
    });
  }
  console.log("  - 10 fields created");

  // ----------------------------------------------------------------
  // 8. Create form layout
  // ----------------------------------------------------------------
  console.log("Creating form layout...");

  const layoutRows = [
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "SINGLE_LINE_TEXT",
          code: "company_name",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "SINGLE_LINE_TEXT",
          code: "department",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "SINGLE_LINE_TEXT",
          code: "contact_name",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "SINGLE_LINE_TEXT",
          code: "postal_code",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "SINGLE_LINE_TEXT",
          code: "tel",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "SINGLE_LINE_TEXT",
          code: "fax",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "SINGLE_LINE_TEXT",
          code: "address",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "DROP_DOWN",
          code: "customer_rank",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "SINGLE_LINE_TEXT",
          code: "email",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
    {
      type: "ROW",
      code: null,
      fields: [
        {
          type: "MULTI_LINE_TEXT",
          code: "notes",
          label: null,
          elementId: null,
          size: { width: null, height: null, innerHeight: null },
        },
      ],
      innerLayout: null,
    },
  ];

  await db
    .insert(formLayouts)
    .values({
      id: uuidv7(),
      appId: customerAppId,
      rows: layoutRows,
      revision: 1,
    })
    .onConflictDoUpdate({
      target: formLayouts.appId,
      set: {
        rows: layoutRows,
        revision: 1,
      },
    });

  console.log("  - Form layout created");

  // ----------------------------------------------------------------
  // 9. Create default view
  // ----------------------------------------------------------------
  console.log("Creating default view...");

  await db
    .insert(views)
    .values({
      id: uuidv7(),
      appId: customerAppId,
      viewName: "(すべて)",
      viewType: "LIST",
      fields: [
        "company_name",
        "department",
        "contact_name",
        "postal_code",
        "tel",
        "fax",
        "address",
        "customer_rank",
        "email",
        "notes",
      ],
      pager: true,
      sort: [],
      index: 0,
      builtinType: "ALL",
    })
    .onConflictDoUpdate({
      target: [views.appId, views.viewName],
      set: {
        viewType: "LIST",
        fields: [
          "company_name",
          "department",
          "contact_name",
          "postal_code",
          "tel",
          "fax",
          "address",
          "customer_rank",
          "email",
          "notes",
        ],
        pager: true,
        sort: [],
        index: 0,
        builtinType: "ALL",
      },
    });

  console.log("  - Default list view created");

  // ----------------------------------------------------------------
  // 10. Create sample records (for CSV export tests — need 3+ records)
  // ----------------------------------------------------------------
  console.log("Creating sample records...");

  const sampleRecords = [
    {
      id: uuidv7(),
      appId: customerAppId,
      revision: 1,
      fieldValues: {
        company_name: { value: "サンプル株式会社A", type: "SINGLE_LINE_TEXT" },
        department: { value: "営業部", type: "SINGLE_LINE_TEXT" },
        contact_name: { value: "田中太郎", type: "SINGLE_LINE_TEXT" },
        postal_code: { value: "1000001", type: "SINGLE_LINE_TEXT" },
        tel: { value: "0312345678", type: "SINGLE_LINE_TEXT" },
        fax: { value: "0312345679", type: "SINGLE_LINE_TEXT" },
        address: { value: "東京都千代田区千代田1-1", type: "SINGLE_LINE_TEXT" },
        customer_rank: { value: "A", type: "DROP_DOWN" },
        email: { value: "tanaka@sample-a.com", type: "SINGLE_LINE_TEXT" },
        notes: { value: "主要取引先。月次定例あり。", type: "MULTI_LINE_TEXT" },
      },
      creatorId: adminId,
      modifierId: adminId,
    },
    {
      id: uuidv7(),
      appId: customerAppId,
      revision: 1,
      fieldValues: {
        company_name: { value: "サンプル株式会社B", type: "SINGLE_LINE_TEXT" },
        department: { value: "開発部", type: "SINGLE_LINE_TEXT" },
        contact_name: { value: "鈴木花子", type: "SINGLE_LINE_TEXT" },
        postal_code: { value: "2000002", type: "SINGLE_LINE_TEXT" },
        tel: { value: "0456789012", type: "SINGLE_LINE_TEXT" },
        fax: { value: "0456789013", type: "SINGLE_LINE_TEXT" },
        address: { value: "神奈川県横浜市西区1-2", type: "SINGLE_LINE_TEXT" },
        customer_rank: { value: "B", type: "DROP_DOWN" },
        email: { value: "suzuki@sample-b.com", type: "SINGLE_LINE_TEXT" },
        notes: {
          value: "新規開拓先。技術部門との連携検討中。",
          type: "MULTI_LINE_TEXT",
        },
      },
      creatorId: adminId,
      modifierId: adminId,
    },
    {
      id: uuidv7(),
      appId: customerAppId,
      revision: 1,
      fieldValues: {
        company_name: { value: "サンプル株式会社C", type: "SINGLE_LINE_TEXT" },
        department: { value: "総務部", type: "SINGLE_LINE_TEXT" },
        contact_name: { value: "佐藤次郎", type: "SINGLE_LINE_TEXT" },
        postal_code: { value: "3000003", type: "SINGLE_LINE_TEXT" },
        tel: { value: "0523456789", type: "SINGLE_LINE_TEXT" },
        fax: { value: "0523456790", type: "SINGLE_LINE_TEXT" },
        address: { value: "大阪府大阪市北区3-3", type: "SINGLE_LINE_TEXT" },
        customer_rank: { value: "C", type: "DROP_DOWN" },
        email: { value: "sato@sample-c.com", type: "SINGLE_LINE_TEXT" },
        notes: {
          value: "年間契約更新予定。担当者変更の可能性あり。",
          type: "MULTI_LINE_TEXT",
        },
      },
      creatorId: adminId,
      modifierId: adminId,
    },
  ];

  const [{ count: existingRecordCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(records)
    .where(eq(records.appId, customerAppId));

  if (Number(existingRecordCount) < 3) {
    await db.insert(records).values(sampleRecords);
    console.log("  - 3 sample records created");
  } else {
    console.log("  - sample records already exist");
  }

  console.log("\nSeed completed successfully!");
  console.log("\nTest accounts:");
  console.log("  admin / Admin123! (systemAdmin=true, isActive=true)");
  console.log("  testuser@example.cybozu.com / TestPass123! (isActive=true)");
  console.log("  disabled@example.cybozu.com / TestPass123! (isActive=false)");
  console.log("\n顧客リスト app ID:", customerAppId);
  console.log(
    "NOTE: The app ID is dynamic (UUID). Update test docs if they reference a fixed app ID (e.g., 4).",
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
