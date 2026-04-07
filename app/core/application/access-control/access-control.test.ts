import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { addSystemPermission } from "./addSystemPermission";
import { deleteSystemPermission } from "./deleteSystemPermission";
import { evaluateSystemPermission } from "./evaluateSystemPermission";
import { getAppAcl } from "./getAppAcl";
import { getFieldAcl } from "./getFieldAcl";
import { getRecordAcl } from "./getRecordAcl";
import { listSystemPermissions } from "./listSystemPermissions";
import { updateAppAcl } from "./updateAppAcl";
import { updateFieldAcl } from "./updateFieldAcl";
import { updateRecordAcl } from "./updateRecordAcl";
import { updateSystemPermission } from "./updateSystemPermission";

const headers = createMockHeaders();

// ============================================
// Test Data Helpers
// ============================================

async function createUser(
  db: ReturnType<typeof setupTestContainer> extends () => infer C
    ? C extends { db: infer D }
      ? D
      : never
    : never,
  opts: {
    loginName: string;
    displayName?: string;
    email?: string;
  },
) {
  const [user] = await db
    .insert(schema.users)
    .values({
      loginName: opts.loginName,
      displayName: opts.displayName ?? opts.loginName,
      email: opts.email ?? `${opts.loginName}@test.com`,
      passwordHash: "test-hash",
    })
    .returning();
  return user;
}

async function createOrganization(
  db: Parameters<typeof createUser>[0],
  opts: { name: string; code: string; parentOrganizationId?: string },
) {
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: opts.name,
      code: opts.code,
      parentOrganizationId: opts.parentOrganizationId,
    })
    .returning();
  return org;
}

async function createGroup(
  db: Parameters<typeof createUser>[0],
  opts: { name: string; code: string },
) {
  const [group] = await db
    .insert(schema.groups)
    .values({ name: opts.name, code: opts.code })
    .returning();
  return group;
}

async function addUserToOrganization(
  db: Parameters<typeof createUser>[0],
  userId: string,
  organizationId: string,
) {
  await db.insert(schema.userOrganizations).values({ userId, organizationId });
}

async function addUserToGroup(
  db: Parameters<typeof createUser>[0],
  userId: string,
  groupId: string,
) {
  await db.insert(schema.userGroups).values({ userId, groupId });
}

async function createApp(
  db: Parameters<typeof createUser>[0],
  opts: { name: string; creatorId: string },
) {
  const [app] = await db
    .insert(schema.apps)
    .values({
      name: opts.name,
      creatorId: opts.creatorId,
      modifierId: opts.creatorId,
    })
    .returning();
  return app;
}

async function createAppAclRule(
  db: Parameters<typeof createUser>[0],
  opts: {
    appId: string;
    priority: number;
    entityType: string;
    entityCode: string | null;
    appEditable?: boolean;
    recordViewable?: boolean;
    revision?: number;
  },
) {
  const [rule] = await db
    .insert(schema.appAclRules)
    .values({
      appId: opts.appId,
      priority: opts.priority,
      entityType: opts.entityType,
      entityCode: opts.entityCode,
      appEditable: opts.appEditable ?? false,
      recordViewable: opts.recordViewable ?? false,
      revision: opts.revision ?? 0,
    })
    .returning();
  return rule;
}

async function createSystemPermission(
  db: Parameters<typeof createUser>[0],
  opts: {
    entityType: string;
    entityCode: string;
    systemAdmin?: boolean;
    appCreate?: boolean;
    spaceCreate?: boolean;
    guestSpaceCreate?: boolean;
    appManage?: boolean;
    appGroupViewable?: boolean;
    appGroupManageable?: boolean;
  },
) {
  const [perm] = await db
    .insert(schema.systemPermissions)
    .values({
      entityType: opts.entityType,
      entityCode: opts.entityCode,
      systemAdmin: opts.systemAdmin ?? false,
      appCreate: opts.appCreate ?? false,
      spaceCreate: opts.spaceCreate ?? false,
      guestSpaceCreate: opts.guestSpaceCreate ?? false,
      appManage: opts.appManage ?? false,
      appGroupViewable: opts.appGroupViewable ?? false,
      appGroupManageable: opts.appGroupManageable ?? false,
    })
    .returning();
  return perm;
}

// ============================================
// UC-AC01: App ACL Get
// ============================================

describe("getAppAcl", () => {
  const getContainer = setupTestContainer();

  it("should return app ACL with appId, rights, and revision when operator has appEditable permission", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
      recordViewable: true,
    });

    const result = await getAppAcl({
      container: c,
      headers,
      input: { operatorId: user.id, appId: app.id },
    });

    expect(result.appId).toBe(app.id);
    expect(result.rights).toBeDefined();
    expect(typeof result.revision).toBe("number");
  });

  it("should return all access right entries when multiple entries exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
      recordViewable: true,
    });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 1,
      entityType: "GROUP",
      entityCode: "everyone",
      appEditable: false,
      recordViewable: true,
    });

    const result = await getAppAcl({
      container: c,
      headers,
      input: { operatorId: user.id, appId: app.id },
    });

    expect(result.rights.length).toBeGreaterThanOrEqual(2);
  });

  it("should throw ForbiddenError when operator does not have appEditable permission", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: false,
      recordViewable: true,
    });

    await expect(
      getAppAcl({
        container: c,
        headers,
        input: { operatorId: user.id, appId: app.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError when app does not exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      getAppAcl({
        container: c,
        headers,
        input: { operatorId: user.id, appId: "non-existent-app" },
      }),
    ).rejects.toThrow();
  });

  it("should succeed when operator is app creator with appEditable", async () => {
    const c = getContainer();
    const creator = await createUser(c.db, { loginName: "creator-user" });
    const app = await createApp(c.db, {
      name: "Test App",
      creatorId: creator.id,
    });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: creator.loginName,
      appEditable: true,
    });

    const result = await getAppAcl({
      container: c,
      headers,
      input: { operatorId: creator.id, appId: app.id },
    });

    expect(result.appId).toBe(app.id);
  });

  it("should succeed when operator has appEditable through organization", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "org-user" });
    const org = await createOrganization(c.db, {
      name: "OrgA",
      code: "org-a",
    });
    await addUserToOrganization(c.db, user.id, org.id);
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "ORGANIZATION",
      entityCode: org.code,
      appEditable: true,
    });

    const result = await getAppAcl({
      container: c,
      headers,
      input: { operatorId: user.id, appId: app.id },
    });

    expect(result.appId).toBe(app.id);
  });
});

// ============================================
// UC-AC02: App ACL Update
// ============================================

describe("updateAppAcl", () => {
  const getContainer = setupTestContainer();

  it("should update app ACL with valid rights and correct revision", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
      recordViewable: true,
      revision: 0,
    });

    const result = await updateAppAcl({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        appId: app.id,
        rights: [
          {
            entity: { type: "USER", code: user.loginName },
            includeSubs: false,
            appEditable: true,
            recordViewable: true,
            recordAddable: true,
            recordEditable: false,
            recordDeletable: false,
            recordImportable: false,
            recordExportable: false,
          },
        ],
        revision: 0,
      },
    });

    expect(result.appId).toBe(app.id);
    expect(result.rights.length).toBe(1);
  });

  it("should skip revision check when revision is omitted", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await updateAppAcl({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        appId: app.id,
        rights: [
          {
            entity: { type: "USER", code: user.loginName },
            includeSubs: false,
            appEditable: true,
            recordViewable: true,
            recordAddable: false,
            recordEditable: false,
            recordDeletable: false,
            recordImportable: false,
            recordExportable: false,
          },
        ],
      },
    });

    expect(result.appId).toBe(app.id);
  });

  it("should move Everyone to end when Everyone entry is included", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await updateAppAcl({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        appId: app.id,
        rights: [
          {
            entity: { type: "GROUP", code: "everyone" },
            includeSubs: false,
            appEditable: false,
            recordViewable: true,
            recordAddable: false,
            recordEditable: false,
            recordDeletable: false,
            recordImportable: false,
            recordExportable: false,
          },
          {
            entity: { type: "USER", code: user.loginName },
            includeSubs: false,
            appEditable: true,
            recordViewable: true,
            recordAddable: true,
            recordEditable: false,
            recordDeletable: false,
            recordImportable: false,
            recordExportable: false,
          },
        ],
      },
    });

    const lastEntry = result.rights[result.rights.length - 1];
    expect(lastEntry.entity.type).toBe("GROUP");
    expect(lastEntry.entity.code).toBe("everyone");
  });

  it("should throw ForbiddenError when operator lacks appEditable", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: false,
    });

    await expect(
      updateAppAcl({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          appId: app.id,
          rights: [
            {
              entity: { type: "USER", code: user.loginName },
              includeSubs: false,
              appEditable: true,
              recordViewable: true,
              recordAddable: false,
              recordEditable: false,
              recordDeletable: false,
              recordImportable: false,
              recordExportable: false,
            },
          ],
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BusinessRuleError with EmptyRights when rights is empty", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    await expect(
      updateAppAcl({
        container: c,
        headers,
        input: { operatorId: user.id, appId: app.id, rights: [] },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError with DuplicateEntity when same entity appears twice", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const entry = {
      entity: { type: "USER" as const, code: user.loginName },
      includeSubs: false,
      appEditable: true,
      recordViewable: true,
      recordAddable: false,
      recordEditable: false,
      recordDeletable: false,
      recordImportable: false,
      recordExportable: false,
    };

    await expect(
      updateAppAcl({
        container: c,
        headers,
        input: { operatorId: user.id, appId: app.id, rights: [entry, entry] },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError with PermissionDependency when editable=true but viewable=false", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    await expect(
      updateAppAcl({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          appId: app.id,
          rights: [
            {
              entity: { type: "USER", code: user.loginName },
              includeSubs: false,
              appEditable: true,
              recordViewable: false,
              recordAddable: false,
              recordEditable: true,
              recordDeletable: false,
              recordImportable: false,
              recordExportable: false,
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError with PermissionDependency when deletable=true but viewable=false", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    await expect(
      updateAppAcl({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          appId: app.id,
          rights: [
            {
              entity: { type: "USER", code: user.loginName },
              includeSubs: false,
              appEditable: true,
              recordViewable: false,
              recordAddable: false,
              recordEditable: false,
              recordDeletable: true,
              recordImportable: false,
              recordExportable: false,
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError with ImportDependency when importable=true but addable=false", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    await expect(
      updateAppAcl({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          appId: app.id,
          rights: [
            {
              entity: { type: "USER", code: user.loginName },
              includeSubs: false,
              appEditable: true,
              recordViewable: true,
              recordAddable: false,
              recordEditable: false,
              recordDeletable: false,
              recordImportable: true,
              recordExportable: false,
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed with all permission flags set to true", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await updateAppAcl({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        appId: app.id,
        rights: [
          {
            entity: { type: "USER", code: user.loginName },
            includeSubs: false,
            appEditable: true,
            recordViewable: true,
            recordAddable: true,
            recordEditable: true,
            recordDeletable: true,
            recordImportable: true,
            recordExportable: true,
          },
        ],
      },
    });

    expect(result.rights[0].appEditable).toBe(true);
  });

  it("should succeed with all permission flags set to false", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await updateAppAcl({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        appId: app.id,
        rights: [
          {
            entity: { type: "USER", code: user.loginName },
            includeSubs: false,
            appEditable: false,
            recordViewable: false,
            recordAddable: false,
            recordEditable: false,
            recordDeletable: false,
            recordImportable: false,
            recordExportable: false,
          },
        ],
      },
    });

    expect(result.rights[0].appEditable).toBe(false);
  });
});

// ============================================
// UC-AC07: System Permission List
// ============================================

describe("listSystemPermissions", () => {
  const getContainer = setupTestContainer();

  it("should return all system permissions when operator has system admin", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      systemAdmin: true,
    });

    const result = await listSystemPermissions({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.permissions).toBeDefined();
    expect(result.permissions.length).toBeGreaterThanOrEqual(1);
  });

  it("should throw ForbiddenError when operator lacks system admin and is not cybozu admin", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });

    await expect(
      listSystemPermissions({
        container: c,
        headers,
        input: { operatorId: user.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should return empty permissions array when no system permissions exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      systemAdmin: true,
    });

    const result = await listSystemPermissions({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(Array.isArray(result.permissions)).toBe(true);
  });

  it("should return permissions of all entity types", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      systemAdmin: true,
    });
    const org = await createOrganization(c.db, {
      name: "OrgA",
      code: "org-a",
    });
    await createSystemPermission(c.db, {
      entityType: "ORGANIZATION",
      entityCode: org.code,
      appCreate: true,
    });
    const group = await createGroup(c.db, { name: "GroupA", code: "group-a" });
    await createSystemPermission(c.db, {
      entityType: "GROUP",
      entityCode: group.code,
      spaceCreate: true,
    });

    const result = await listSystemPermissions({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.permissions.length).toBe(3);
  });

  it("should succeed when operator has system admin via organization", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "org-admin" });
    const org = await createOrganization(c.db, {
      name: "OrgAdmin",
      code: "org-admin",
    });
    await addUserToOrganization(c.db, user.id, org.id);
    await createSystemPermission(c.db, {
      entityType: "ORGANIZATION",
      entityCode: org.code,
      systemAdmin: true,
    });

    const result = await listSystemPermissions({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.permissions).toBeDefined();
  });
});

// ============================================
// UC-AC08: System Permission Add
// ============================================

describe("addSystemPermission", () => {
  const getContainer = setupTestContainer();

  it("should create USER system permission", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });
    const target = await createUser(c.db, { loginName: "target-user" });

    const result = await addSystemPermission({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        entity: { type: "USER", code: target.loginName },
        includeSubs: false,
        systemAdmin: false,
        appGroupViewable: true,
        appGroupManageable: false,
        appCreate: true,
        appManage: false,
        spaceCreate: false,
        guestSpaceCreate: false,
      },
    });

    expect(result.systemPermissionId).toBeDefined();
    expect(result.entity.type).toBe("USER");
  });

  it("should create ORGANIZATION system permission", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });

    const result = await addSystemPermission({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        entity: { type: "ORGANIZATION", code: "org-x" },
        includeSubs: false,
        systemAdmin: false,
        appGroupViewable: false,
        appGroupManageable: false,
        appCreate: true,
        appManage: false,
        spaceCreate: false,
        guestSpaceCreate: false,
      },
    });

    expect(result.entity.type).toBe("ORGANIZATION");
  });

  it("should create GROUP system permission", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });

    const result = await addSystemPermission({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        entity: { type: "GROUP", code: "group-x" },
        includeSubs: false,
        systemAdmin: false,
        appGroupViewable: false,
        appGroupManageable: false,
        appCreate: false,
        appManage: false,
        spaceCreate: true,
        guestSpaceCreate: false,
      },
    });

    expect(result.entity.type).toBe("GROUP");
  });

  it("should throw ForbiddenError when operator lacks system admin", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });

    await expect(
      addSystemPermission({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          entity: { type: "USER", code: "some-code" },
          includeSubs: false,
          systemAdmin: false,
          appGroupViewable: false,
          appGroupManageable: false,
          appCreate: false,
          appManage: false,
          spaceCreate: false,
          guestSpaceCreate: false,
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ConflictError when same entity already has a system permission", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });
    const target = await createUser(c.db, { loginName: "target-user" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: target.loginName,
      appCreate: true,
    });

    await expect(
      addSystemPermission({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          entity: { type: "USER", code: target.loginName },
          includeSubs: false,
          systemAdmin: false,
          appGroupViewable: false,
          appGroupManageable: false,
          appCreate: true,
          appManage: false,
          spaceCreate: false,
          guestSpaceCreate: false,
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw BusinessRuleError with InvalidSystemEntityType for CREATOR type", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });

    await expect(
      addSystemPermission({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          entity: { type: "CREATOR", code: null },
          includeSubs: false,
          systemAdmin: false,
          appGroupViewable: false,
          appGroupManageable: false,
          appCreate: false,
          appManage: false,
          spaceCreate: false,
          guestSpaceCreate: false,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should create with all flags true", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });

    const result = await addSystemPermission({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        entity: { type: "USER", code: "all-true-user" },
        includeSubs: false,
        systemAdmin: true,
        appGroupViewable: true,
        appGroupManageable: true,
        appCreate: true,
        appManage: true,
        spaceCreate: true,
        guestSpaceCreate: true,
      },
    });

    expect(result.systemAdmin).toBe(true);
    expect(result.appCreate).toBe(true);
  });

  it("should create with all flags false", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });

    const result = await addSystemPermission({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        entity: { type: "USER", code: "all-false-user" },
        includeSubs: false,
        systemAdmin: false,
        appGroupViewable: false,
        appGroupManageable: false,
        appCreate: false,
        appManage: false,
        spaceCreate: false,
        guestSpaceCreate: false,
      },
    });

    expect(result.systemAdmin).toBe(false);
    expect(result.appCreate).toBe(false);
  });
});

// ============================================
// UC-AC09: System Permission Update
// ============================================

describe("updateSystemPermission", () => {
  const getContainer = setupTestContainer();

  it("should update permission flags successfully", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });
    const target = await createUser(c.db, { loginName: "target-user" });
    const targetPerm = await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: target.loginName,
      appCreate: false,
    });

    const result = await updateSystemPermission({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        systemPermissionId: targetPerm.id,
        systemAdmin: false,
        appGroupViewable: true,
        appGroupManageable: false,
        appCreate: true,
        appManage: false,
        spaceCreate: false,
        guestSpaceCreate: false,
      },
    });

    expect(result.appCreate).toBe(true);
    expect(result.appGroupViewable).toBe(true);
  });

  it("should throw ForbiddenError when operator lacks system admin", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });

    await expect(
      updateSystemPermission({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          systemPermissionId: "some-id",
          systemAdmin: false,
          appGroupViewable: false,
          appGroupManageable: false,
          appCreate: false,
          appManage: false,
          spaceCreate: false,
          guestSpaceCreate: false,
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError when permission does not exist", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });

    await expect(
      updateSystemPermission({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          systemPermissionId: "non-existent-id",
          systemAdmin: false,
          appGroupViewable: false,
          appGroupManageable: false,
          appCreate: false,
          appManage: false,
          spaceCreate: false,
          guestSpaceCreate: false,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should update systemAdmin from false to true", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });
    const target = await createUser(c.db, { loginName: "target-user" });
    const targetPerm = await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: target.loginName,
      systemAdmin: false,
    });

    const result = await updateSystemPermission({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        systemPermissionId: targetPerm.id,
        systemAdmin: true,
        appGroupViewable: false,
        appGroupManageable: false,
        appCreate: false,
        appManage: false,
        spaceCreate: false,
        guestSpaceCreate: false,
      },
    });

    expect(result.systemAdmin).toBe(true);
  });
});

// ============================================
// UC-AC10: System Permission Delete
// ============================================

describe("deleteSystemPermission", () => {
  const getContainer = setupTestContainer();

  it("should delete system permission successfully", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });
    const target = await createUser(c.db, { loginName: "target-user" });
    const targetPerm = await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: target.loginName,
      appCreate: true,
    });

    await deleteSystemPermission({
      container: c,
      headers,
      input: { operatorId: admin.id, systemPermissionId: targetPerm.id },
    });

    // Verify deletion
    const list = await listSystemPermissions({
      container: c,
      headers,
      input: { operatorId: admin.id },
    });
    const found = list.permissions.find(
      (p) => p.systemPermissionId === targetPerm.id,
    );
    expect(found).toBeUndefined();
  });

  it("should throw ForbiddenError when operator lacks system admin", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });

    await expect(
      deleteSystemPermission({
        container: c,
        headers,
        input: { operatorId: user.id, systemPermissionId: "some-id" },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError when permission does not exist", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });

    await expect(
      deleteSystemPermission({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          systemPermissionId: "non-existent-id",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when trying to delete already deleted permission", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });
    const target = await createUser(c.db, { loginName: "target-user" });
    const targetPerm = await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: target.loginName,
      appCreate: true,
    });

    await deleteSystemPermission({
      container: c,
      headers,
      input: { operatorId: admin.id, systemPermissionId: targetPerm.id },
    });

    await expect(
      deleteSystemPermission({
        container: c,
        headers,
        input: { operatorId: admin.id, systemPermissionId: targetPerm.id },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ============================================
// UC-AC11: Evaluate System Permission
// ============================================

describe("evaluateSystemPermission", () => {
  const getContainer = setupTestContainer();

  it("should return user direct permissions", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      appCreate: true,
    });

    const result = await evaluateSystemPermission({
      container: c,
      headers,
      input: { targetUserId: user.id },
    });

    expect(result.userId).toBe(user.id);
    expect(result.appCreate).toBe(true);
    expect(result.systemAdmin).toBe(false);
  });

  it("should OR-combine permissions from organization", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const orgA = await createOrganization(c.db, {
      name: "OrgA",
      code: "org-a",
    });
    const orgB = await createOrganization(c.db, {
      name: "OrgB",
      code: "org-b",
    });
    await addUserToOrganization(c.db, user.id, orgA.id);
    await addUserToOrganization(c.db, user.id, orgB.id);
    await createSystemPermission(c.db, {
      entityType: "ORGANIZATION",
      entityCode: orgA.code,
      appCreate: true,
    });
    await createSystemPermission(c.db, {
      entityType: "ORGANIZATION",
      entityCode: orgB.code,
      spaceCreate: true,
    });

    const result = await evaluateSystemPermission({
      container: c,
      headers,
      input: { targetUserId: user.id },
    });

    expect(result.appCreate).toBe(true);
    expect(result.spaceCreate).toBe(true);
    expect(result.appManage).toBe(false);
  });

  it("should OR-combine permissions from groups", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const group = await createGroup(c.db, { name: "GroupA", code: "group-a" });
    await addUserToGroup(c.db, user.id, group.id);
    await createSystemPermission(c.db, {
      entityType: "GROUP",
      entityCode: group.code,
      appManage: true,
    });

    const result = await evaluateSystemPermission({
      container: c,
      headers,
      input: { targetUserId: user.id },
    });

    expect(result.appManage).toBe(true);
  });

  it("should return all true when systemAdmin is true in any permission", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      systemAdmin: true,
    });

    const result = await evaluateSystemPermission({
      container: c,
      headers,
      input: { targetUserId: user.id },
    });

    expect(result.systemAdmin).toBe(true);
    expect(result.appCreate).toBe(true);
    expect(result.spaceCreate).toBe(true);
    expect(result.guestSpaceCreate).toBe(true);
  });

  it("should return all false when no permissions exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await evaluateSystemPermission({
      container: c,
      headers,
      input: { targetUserId: user.id },
    });

    expect(result.systemAdmin).toBe(false);
    expect(result.appCreate).toBe(false);
    expect(result.spaceCreate).toBe(false);
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const c = getContainer();

    await expect(
      evaluateSystemPermission({
        container: c,
        headers,
        input: { targetUserId: "non-existent-user" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should return all false when only all-false permission exists", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      systemAdmin: false,
      appCreate: false,
      spaceCreate: false,
    });

    const result = await evaluateSystemPermission({
      container: c,
      headers,
      input: { targetUserId: user.id },
    });

    expect(result.systemAdmin).toBe(false);
    expect(result.appCreate).toBe(false);
    expect(result.spaceCreate).toBe(false);
  });
});

// ============================================
// UC-AC05: Field ACL Get
// ============================================

describe("getFieldAcl", () => {
  const getContainer = setupTestContainer();

  it("should return field ACL when operator has appEditable", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await getFieldAcl({
      container: c,
      headers,
      input: { operatorId: user.id, appId: app.id },
    });

    expect(result.appId).toBe(app.id);
    expect(result.rights).toBeDefined();
    expect(typeof result.revision).toBe("number");
  });

  it("should throw ForbiddenError when operator lacks appEditable", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: false,
    });

    await expect(
      getFieldAcl({
        container: c,
        headers,
        input: { operatorId: user.id, appId: app.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should return empty rights when no field ACL is set", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await getFieldAcl({
      container: c,
      headers,
      input: { operatorId: user.id, appId: app.id },
    });

    expect(result.rights.length).toBe(0);
  });
});

// ============================================
// UC-AC03: Record ACL Get
// ============================================

describe("getRecordAcl", () => {
  const getContainer = setupTestContainer();

  it("should return record ACL when operator has appEditable", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await getRecordAcl({
      container: c,
      headers,
      input: { operatorId: user.id, appId: app.id },
    });

    expect(result.appId).toBe(app.id);
    expect(result.rights).toBeDefined();
    expect(typeof result.revision).toBe("number");
  });

  it("should throw ForbiddenError when operator lacks appEditable", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: false,
    });

    await expect(
      getRecordAcl({
        container: c,
        headers,
        input: { operatorId: user.id, appId: app.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// UC-AC06: Field ACL Update
// ============================================

describe("updateFieldAcl", () => {
  const getContainer = setupTestContainer();

  it("should update field ACL with valid rights and revision", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await updateFieldAcl({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        appId: app.id,
        rights: [
          {
            fieldCode: "field1" as never,
            entities: [
              {
                entity: { type: "USER", code: user.loginName },
                includeSubs: false,
                accessibility: "READ" as const,
              },
            ],
          },
        ],
      },
    });

    expect(result.appId).toBe(app.id);
    expect(result.rights.length).toBe(1);
  });

  it("should throw BusinessRuleError for duplicate field codes", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    await expect(
      updateFieldAcl({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          appId: app.id,
          rights: [
            {
              fieldCode: "field1" as never,
              entities: [
                {
                  entity: { type: "USER", code: user.loginName },
                  includeSubs: false,
                  accessibility: "READ" as const,
                },
              ],
            },
            {
              fieldCode: "field1" as never,
              entities: [
                {
                  entity: { type: "GROUP", code: "everyone" },
                  includeSubs: false,
                  accessibility: "NONE" as const,
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should allow empty rights to clear all field ACL", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await updateFieldAcl({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        appId: app.id,
        rights: [],
      },
    });

    expect(result.rights.length).toBe(0);
  });

  it("should throw ForbiddenError when operator lacks appEditable", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: false,
    });

    await expect(
      updateFieldAcl({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          appId: app.id,
          rights: [],
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// UC-AC04: Record ACL Update
// ============================================

describe("updateRecordAcl", () => {
  const getContainer = setupTestContainer();

  it("should update record ACL with valid rights and revision", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    const result = await updateRecordAcl({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        appId: app.id,
        rights: [
          {
            filterCond: null,
            entities: [
              {
                entity: { type: "USER", code: user.loginName },
                includeSubs: false,
                viewable: true,
                editable: true,
                deletable: false,
              },
            ],
          },
        ],
      },
    });

    expect(result.appId).toBe(app.id);
    expect(result.rights.length).toBe(1);
  });

  it("should throw BusinessRuleError with PermissionDependency when editable=true but viewable=false", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "admin-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: true,
    });

    await expect(
      updateRecordAcl({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          appId: app.id,
          rights: [
            {
              filterCond: null,
              entities: [
                {
                  entity: { type: "USER", code: user.loginName },
                  includeSubs: false,
                  viewable: false,
                  editable: true,
                  deletable: false,
                },
              ],
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw ForbiddenError when operator lacks appEditable", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });
    const app = await createApp(c.db, { name: "Test App", creatorId: user.id });
    await createAppAclRule(c.db, {
      appId: app.id,
      priority: 0,
      entityType: "USER",
      entityCode: user.loginName,
      appEditable: false,
    });

    await expect(
      updateRecordAcl({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          appId: app.id,
          rights: [],
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
