import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { listUserAccessUsages } from "./listUserAccessUsages";

describe("listUserAccessUsages", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertUser(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<{ displayName: string }> = {},
  ) {
    const userId = crypto.randomUUID();
    const hashed = await hasher.hash("password123");
    await container.db.insert(schema.users).values({
      id: userId,
      loginName: `user-${userId}@example.com`,
      displayName: overrides.displayName ?? "Test User",
      email: `user-${userId}@example.com`,
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });
    return userId;
  }

  async function insertUserAccessUsage(
    container: ReturnType<typeof getContainer>,
    userId: string,
    overrides: {
      lastAccessDate?: Date | null;
      accessDaysLast30?: number;
    } = {},
  ) {
    const values: Record<string, unknown> = {
      id: crypto.randomUUID(),
      userId,
      accessDaysLast30: overrides.accessDaysLast30 ?? 1,
    };
    // Only set lastAccessDate if it's explicitly provided and not null
    // Omitting the field lets the DB store NULL for this nullable column
    if (
      overrides.lastAccessDate !== undefined &&
      overrides.lastAccessDate !== null
    ) {
      values.lastAccessDate = overrides.lastAccessDate;
    }
    await container.db
      .insert(schema.userAccessUsages)
      .values(values as typeof schema.userAccessUsages.$inferInsert);
  }

  it("should return all user access usages", async () => {
    const container = getContainer();
    const userId1 = await insertUser(container, { displayName: "Alice" });
    const userId2 = await insertUser(container, { displayName: "Bob" });
    const userId3 = await insertUser(container, { displayName: "Charlie" });

    await insertUserAccessUsage(container, userId1);
    await insertUserAccessUsage(container, userId2);
    await insertUserAccessUsage(container, userId3);

    const result = await listUserAccessUsages({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.usages.length).toBe(3);
  });

  it("should return empty array when no usages exist", async () => {
    const container = getContainer();

    const result = await listUserAccessUsages({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.usages).toHaveLength(0);
  });

  it("should return a single usage", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await insertUserAccessUsage(container, userId);

    const result = await listUserAccessUsages({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.usages.length).toBe(1);
    expect(result.usages[0].userId).toBe(userId);
  });

  it("should include usages with null lastAccessDate", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await insertUserAccessUsage(container, userId, {
      lastAccessDate: null,
      accessDaysLast30: 0,
    });

    const result = await listUserAccessUsages({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.usages.length).toBe(1);
    expect(result.usages[0].lastAccessDate).toBeNull();
  });

  it("should include usages with accessDaysLast30 of 0", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await insertUserAccessUsage(container, userId, { accessDaysLast30: 0 });

    const result = await listUserAccessUsages({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.usages.length).toBe(1);
    expect(result.usages[0].accessDaysLast30).toBe(0);
  });

  it("should include usages with accessDaysLast30 of 30", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await insertUserAccessUsage(container, userId, { accessDaysLast30: 30 });

    const result = await listUserAccessUsages({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.usages.length).toBe(1);
    expect(result.usages[0].accessDaysLast30).toBe(30);
  });

  it("should return all usages for a large number of users", async () => {
    const container = getContainer();
    const count = 50;
    for (let i = 0; i < count; i++) {
      const userId = await insertUser(container, {
        displayName: `User ${String(i).padStart(3, "0")}`,
      });
      await insertUserAccessUsage(container, userId);
    }

    const result = await listUserAccessUsages({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.usages.length).toBe(count);
  });
});
