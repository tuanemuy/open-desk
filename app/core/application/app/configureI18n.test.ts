import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { configureI18n } from "./configureI18n";

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

describe("configureI18n", () => {
  it("should set a translation", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await configureI18n({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        translations: [
          {
            scope: "GENERAL",
            itemKey: "app_name",
            language: "en",
            value: "English Name",
          },
        ],
        revision: 0,
        modifierId: "user-1",
      },
    });
    expect(result.appId).toBe("app-1");
    expect(result.translationCount).toBeGreaterThanOrEqual(1);
  });

  it("should set multiple translations", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await configureI18n({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        translations: [
          {
            scope: "GENERAL",
            itemKey: "app_name",
            language: "en",
            value: "English",
          },
          {
            scope: "GENERAL",
            itemKey: "app_name",
            language: "ja",
            value: "Japanese",
          },
        ],
        revision: 0,
        modifierId: "user-1",
      },
    });
    expect(result.translationCount).toBeGreaterThanOrEqual(1);
  });

  it("should remove translation when value is empty", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await configureI18n({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        translations: [
          {
            scope: "GENERAL",
            itemKey: "app_name",
            language: "en",
            value: "English",
          },
        ],
        revision: 0,
        modifierId: "user-1",
      },
    });
    const result = await configureI18n({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        translations: [
          { scope: "GENERAL", itemKey: "app_name", language: "en", value: "" },
        ],
        revision: 1,
        modifierId: "user-1",
      },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      configureI18n({
        container,
        headers: headers(),
        input: {
          appId: "bad",
          translations: [],
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
      configureI18n({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          translations: [],
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
    await configureI18n({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        translations: [
          { scope: "GENERAL", itemKey: "k", language: "en", value: "v" },
        ],
        revision: 0,
        modifierId: "user-1",
      },
    });
    await expect(
      configureI18n({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          translations: [],
          revision: 0,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
