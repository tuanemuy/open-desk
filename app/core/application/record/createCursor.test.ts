import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { createCursor } from "./createCursor";

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

describe("createCursor", () => {
  it("should create a cursor with default size", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await createCursor({
      container,
      headers: headers(),
      input: { appId: "app-1" },
    });
    expect(result.cursorId).toBeDefined();
    expect(result.totalCount).toBeDefined();
  });

  it("should create a cursor with size=1 (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await createCursor({
      container,
      headers: headers(),
      input: { appId: "app-1", size: 1 },
    });
    expect(result.cursorId).toBeDefined();
  });

  it("should create a cursor with size=500 (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await createCursor({
      container,
      headers: headers(),
      input: { appId: "app-1", size: 500 },
    });
    expect(result.cursorId).toBeDefined();
  });

  it("should throw InvalidCursorSizeError for size=0", async () => {
    const container = getContainer();
    await expect(
      createCursor({
        container,
        headers: headers(),
        input: { appId: "app-1", size: 0 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw InvalidCursorSizeError for size=501", async () => {
    const container = getContainer();
    await expect(
      createCursor({
        container,
        headers: headers(),
        input: { appId: "app-1", size: 501 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw InvalidCursorSizeError for size=-1", async () => {
    const container = getContainer();
    await expect(
      createCursor({
        container,
        headers: headers(),
        input: { appId: "app-1", size: -1 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should create multiple cursors", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const c1 = await createCursor({
      container,
      headers: headers(),
      input: { appId: "app-1" },
    });
    const c2 = await createCursor({
      container,
      headers: headers(),
      input: { appId: "app-1" },
    });
    expect(c1.cursorId).not.toBe(c2.cursorId);
  });
});
