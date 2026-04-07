import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { configureProcess } from "./configureProcess";

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

describe("configureProcess", () => {
  it("should enable process management with statuses", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await configureProcess({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        isEnabled: true,
        statuses: [
          { statusId: null, name: "Open" },
          { statusId: null, name: "Closed" },
        ],
        transitions: [],
        revision: 0,
        modifierId: "user-1",
      },
    });
    expect(result.appId).toBe("app-1");
    expect(result.statuses.length).toBeGreaterThanOrEqual(2);
  });

  it("should disable process management", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await configureProcess({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        isEnabled: true,
        statuses: [
          { statusId: null, name: "Open" },
          { statusId: null, name: "Closed" },
        ],
        transitions: [],
        revision: 0,
        modifierId: "user-1",
      },
    });
    const result = await configureProcess({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        isEnabled: false,
        statuses: [],
        transitions: [],
        revision: 1,
        modifierId: "user-1",
      },
    });
    expect(result.isEnabled).toBe(false);
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      configureProcess({
        container,
        headers: headers(),
        input: {
          appId: "bad",
          isEnabled: true,
          statuses: [],
          transitions: [],
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
      configureProcess({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          isEnabled: true,
          statuses: [],
          transitions: [],
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
    await configureProcess({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        isEnabled: true,
        statuses: [
          { statusId: null, name: "Open" },
          { statusId: null, name: "Closed" },
        ],
        transitions: [],
        revision: 0,
        modifierId: "user-1",
      },
    });
    await expect(
      configureProcess({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          isEnabled: true,
          statuses: [],
          transitions: [],
          revision: 0,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
