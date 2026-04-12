import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ForbiddenError, NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { updateAppGroup } from "./updateAppGroup";

const getContainer = setupTestContainer();
const headers = () => createMockHeaders();

async function seedUser(
  db: ReturnType<typeof getContainer>["db"],
  id = "user-1",
) {
  await db.insert(schema.users).values({
    id,
    loginName: `login-${id}`,
    displayName: `User ${id}`,
    email: `${id}@test.com`,
    passwordHash: "hash",
  });
}

async function seedAppGroupPermission(
  db: ReturnType<typeof getContainer>["db"],
  entityCode: string,
) {
  await db.insert(schema.systemPermissions).values({
    entityType: "USER",
    entityCode,
    appGroupManageable: true,
  });
}

async function seedAppGroup(
  db: ReturnType<typeof getContainer>["db"],
  id = "group-1",
  overrides: { name?: string; isDefault?: boolean } = {},
) {
  await db.insert(schema.appGroups).values({
    id,
    name: overrides.name ?? `Group ${id}`,
    isDefault: overrides.isDefault ?? false,
  });
}

async function seedApp(
  db: ReturnType<typeof getContainer>["db"],
  id = "app-1",
  creatorId = "user-1",
) {
  await db.insert(schema.apps).values({
    id,
    name: `App ${id}`,
    status: "ACTIVE",
    revision: 1,
    creatorId,
    modifierId: creatorId,
  });
}

describe("updateAppGroup", () => {
  it("should update app group name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");
    await seedAppGroup(container.db, "group-1", { name: "Old Name" });

    const result = await updateAppGroup({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        appGroupId: "group-1",
        name: "New Name",
      },
    });

    expect(result.name).toBe("New Name");
    expect(result.appGroupId).toBe("group-1");
  });

  it("should set isDefault to true and unset previous default", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");
    await seedAppGroup(container.db, "group-default", {
      name: "Default",
      isDefault: true,
    });
    await seedAppGroup(container.db, "group-new", { name: "New Group" });

    const result = await updateAppGroup({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        appGroupId: "group-new",
        isDefault: true,
      },
    });

    expect(result.isDefault).toBe(true);
  });

  it("should update with no fields specified (no-op)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");
    await seedAppGroup(container.db, "group-1", { name: "Same Name" });

    const result = await updateAppGroup({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        appGroupId: "group-1",
      },
    });

    expect(result.name).toBe("Same Name");
    expect(result.appGroupId).toBe("group-1");
  });

  it("should update app group name with 1 character (lower boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");
    await seedAppGroup(container.db);

    const result = await updateAppGroup({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        appGroupId: "group-1",
        name: "A",
      },
    });

    expect(result.name).toBe("A");
  });

  it("should update app group name with 128 characters (upper boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");
    await seedAppGroup(container.db);

    const name = "a".repeat(128);
    const result = await updateAppGroup({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        appGroupId: "group-1",
        name,
      },
    });

    expect(result.name).toBe(name);
  });

  it("should throw ForbiddenError when operator lacks permission", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroup(container.db);

    await expect(
      updateAppGroup({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          appGroupId: "group-1",
          name: "New Name",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError for non-existent app group", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");

    await expect(
      updateAppGroup({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          appGroupId: "non-existent-group",
          name: "New Name",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError for empty name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");
    await seedAppGroup(container.db);

    await expect(
      updateAppGroup({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          appGroupId: "group-1",
          name: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for name exceeding 128 characters", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");
    await seedAppGroup(container.db);

    await expect(
      updateAppGroup({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          appGroupId: "group-1",
          name: "a".repeat(129),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
