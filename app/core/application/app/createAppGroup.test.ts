import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ForbiddenError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createAppGroup } from "./createAppGroup";

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

describe("createAppGroup", () => {
  it("should create an app group with valid name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");

    const result = await createAppGroup({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        name: "My Group",
      },
    });

    expect(result.appGroupId).toBeDefined();
    expect(result.name).toBe("My Group");
    expect(result.isDefault).toBe(false);
    expect(result.appIds).toEqual([]);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should create an app group with 1-character name (lower boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");

    const result = await createAppGroup({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        name: "A",
      },
    });

    expect(result.name).toBe("A");
  });

  it("should create an app group with 128-character name (upper boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");

    const name = "a".repeat(128);
    const result = await createAppGroup({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        name,
      },
    });

    expect(result.name).toBe(name);
  });

  it("should throw ForbiddenError when operator lacks app group manageable permission", async () => {
    const container = getContainer();
    await seedUser(container.db);
    // No permission seeded

    await expect(
      createAppGroup({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          name: "My Group",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BusinessRuleError for empty name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");

    await expect(
      createAppGroup({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          name: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for name exceeding 128 characters", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedAppGroupPermission(container.db, "login-user-1");

    await expect(
      createAppGroup({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          name: "a".repeat(129),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
