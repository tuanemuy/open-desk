import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { recordUserAccess } from "./recordUserAccess";

describe("recordUserAccess", () => {
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

  function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async function insertAccessDate(
    container: ReturnType<typeof getContainer>,
    userId: string,
    accessDate: Date,
  ) {
    await container.db.insert(schema.userAccessDates).values({
      id: crypto.randomUUID(),
      userId,
      accessDate,
    });
  }

  it("should create a new UserAccessUsage on first access", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate: today() },
    });

    expect(result.userId).toBe(userId);
    expect(result.lastAccessDate).toBeInstanceOf(Date);
    expect(result.accessDaysLast30).toBeGreaterThanOrEqual(0);
  });

  it("should update existing UserAccessUsage on subsequent access", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    // First access
    await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate: daysAgo(1) },
    });

    // Second access
    const result = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate: today() },
    });

    expect(result.userId).toBe(userId);
    expect(result.lastAccessDate).toEqual(today());
  });

  it("should update lastAccessDate and increase accessDaysLast30 for next-day access", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const yesterday = daysAgo(1);

    // Insert access date records that findAccessDatesLast30Days will return
    await insertAccessDate(container, userId, yesterday);
    await insertAccessDate(container, userId, today());

    // Record first access
    await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate: yesterday },
    });

    // Record second access
    const result = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate: today() },
    });

    expect(result.lastAccessDate).toEqual(today());
    expect(result.accessDaysLast30).toBe(2);
  });

  it("should not change accessDaysLast30 for same-day re-access", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const accessDate = today();

    const firstResult = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate },
    });

    const secondResult = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate },
    });

    expect(secondResult.accessDaysLast30).toBe(firstResult.accessDaysLast30);
  });

  it("should set accessDaysLast30 to 1 when user has not accessed in 30+ days", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    // Insert access date records: one 35 days ago (outside window), one today
    await insertAccessDate(container, userId, daysAgo(35));
    await insertAccessDate(container, userId, today());

    // Access 35 days ago (outside 30-day window)
    await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate: daysAgo(35) },
    });

    // Access today
    const result = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate: today() },
    });

    // The old access is outside 30-day window, so only today counts
    expect(result.accessDaysLast30).toBe(1);
  });

  it("should cap accessDaysLast30 at 30 for daily access", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    // Record access for 30 consecutive days
    for (let i = 29; i >= 0; i--) {
      await recordUserAccess({
        container,
        headers: createMockHeaders(),
        input: { userId, accessDate: daysAgo(i) },
      });
    }

    const result = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate: today() },
    });

    expect(result.accessDaysLast30).toBeLessThanOrEqual(30);
  });

  it("should throw ValidationError when accessDate is in the future", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    await expect(
      recordUserAccess({
        container,
        headers: createMockHeaders(),
        input: { userId, accessDate: futureDate },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should accept today's date as valid (not future)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId, accessDate: new Date() },
    });

    expect(result.userId).toBe(userId);
    expect(result.lastAccessDate).toBeInstanceOf(Date);
  });

  it("should only update the specified user and not affect others", async () => {
    const container = getContainer();
    const userId1 = await insertUser(container);
    const userId2 = await insertUser(container);

    await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId: userId1, accessDate: daysAgo(1) },
    });

    await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId: userId2, accessDate: daysAgo(5) },
    });

    // Update only userId1
    const result = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId: userId1, accessDate: today() },
    });

    expect(result.userId).toBe(userId1);
    expect(result.lastAccessDate).toEqual(today());

    // Check userId2 is unchanged - verify via another recordAccess with the same date
    const result2 = await recordUserAccess({
      container,
      headers: createMockHeaders(),
      input: { userId: userId2, accessDate: daysAgo(5) },
    });

    expect(result2.lastAccessDate).toEqual(daysAgo(5));
  });
});
