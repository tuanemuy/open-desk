import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { configureCategories } from "./configureCategories";

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
async function seedApp(
  db: ReturnType<typeof getContainer>["db"],
  overrides: Partial<typeof schema.apps.$inferInsert> & { id: string },
) {
  await db.insert(schema.apps).values({
    name: "App",
    status: "ACTIVE",
    revision: 1,
    creatorId: "user-1",
    modifierId: "user-1",
    ...overrides,
  });
}

describe("configureCategories", () => {
  it("should enable categories with a tree", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await configureCategories({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        isEnabled: true,
        categories: [{ categoryId: null, name: "Cat 1", children: [] }],
        revision: 0,
        modifierId: "user-1",
      },
    });
    expect(result.appId).toBe("app-1");
    expect(result.isEnabled).toBe(true);
  });

  it("should disable categories", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await configureCategories({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        isEnabled: true,
        categories: [{ categoryId: null, name: "Cat 1", children: [] }],
        revision: 0,
        modifierId: "user-1",
      },
    });
    const result = await configureCategories({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        isEnabled: false,
        categories: [],
        revision: 1,
        modifierId: "user-1",
      },
    });
    expect(result.isEnabled).toBe(false);
  });

  it("should create hierarchical categories", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await configureCategories({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        isEnabled: true,
        categories: [
          {
            categoryId: null,
            name: "Parent",
            children: [{ categoryId: null, name: "Child", children: [] }],
          },
        ],
        revision: 0,
        modifierId: "user-1",
      },
    });
    expect(result.isEnabled).toBe(true);
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      configureCategories({
        container,
        headers: headers(),
        input: {
          appId: "bad",
          isEnabled: true,
          categories: [],
          revision: 0,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      configureCategories({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          isEnabled: true,
          categories: [],
          revision: 0,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError on revision conflict", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await configureCategories({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        isEnabled: true,
        categories: [{ categoryId: null, name: "C1", children: [] }],
        revision: 0,
        modifierId: "user-1",
      },
    });
    await expect(
      configureCategories({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          isEnabled: true,
          categories: [],
          revision: 0,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for empty category name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      configureCategories({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          isEnabled: true,
          categories: [{ categoryId: null, name: "", children: [] }],
          revision: 0,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
