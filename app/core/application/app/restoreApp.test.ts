import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { restoreApp } from "./restoreApp";

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
    name: "Test App",
    status: "ACTIVE",
    revision: 1,
    creatorId: "user-1",
    modifierId: "user-1",
    ...overrides,
  });
}

describe("restoreApp", () => {
  it("should restore a DELETED app to ACTIVE status", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    const result = await restoreApp({
      container,
      headers: headers(),
      input: { appId: "app-1", executorId: "user-1" },
    });
    expect(result.status).toBe("ACTIVE");
    expect(result.appId).toBe("app-1");
    expect(result.restoredAt).toBeInstanceOf(Date);
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      restoreApp({
        container,
        headers: headers(),
        input: { appId: "non-existent", executorId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when restoring an ACTIVE app", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-2", status: "ACTIVE" });
    await expect(
      restoreApp({
        container,
        headers: headers(),
        input: { appId: "app-2", executorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when restoring a PREVIEW app", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-3", status: "PREVIEW" });
    await expect(
      restoreApp({
        container,
        headers: headers(),
        input: { appId: "app-3", executorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when app count reaches 1000", async () => {
    const container = getContainer();
    await seedUser(container.db);
    const values = Array.from({ length: 1000 }, (_, i) => ({
      id: `app-limit-${i}`,
      name: `App ${i}`,
      status: "ACTIVE" as const,
      revision: 1,
      creatorId: "user-1",
      modifierId: "user-1",
    }));
    for (let i = 0; i < values.length; i += 100) {
      await container.db.insert(schema.apps).values(values.slice(i, i + 100));
    }
    await seedApp(container.db, { id: "app-deleted", status: "DELETED" });
    await expect(
      restoreApp({
        container,
        headers: headers(),
        input: { appId: "app-deleted", executorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
