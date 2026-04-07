import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { ValidationError } from "../error";
import { follow } from "./follow";
import { listFollowers } from "./listFollowers";

describe("listFollowers", () => {
  const getContainer = setupTestContainer();

  const insertUser = async (
    db: ReturnType<typeof getContainer>["db"],
    overrides: Partial<typeof schema.users.$inferInsert> = {},
  ) => {
    const userId = overrides.id ?? uuidv7();
    await db.insert(schema.users).values({
      id: userId,
      loginName: `user-${userId}`,
      displayName: "Test User",
      email: `${userId}@example.com`,
      passwordHash: "hashed",
      isActive: true,
      ...overrides,
    });
    return userId;
  };

  const createFollowers = async (
    container: ReturnType<typeof getContainer>,
    followeeId: string,
    count: number,
  ) => {
    const followerIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const followerId = await insertUser(container.db);
      await follow({
        container,
        headers: createMockHeaders(),
        input: { followerId, followeeId },
      });
      followerIds.push(followerId);
    }
    return followerIds;
  };

  it("should return followers in newest-first order with totalCount", async () => {
    const container = getContainer();
    const targetUserId = await insertUser(container.db);
    await createFollowers(container, targetUserId, 3);

    const result = await listFollowers({
      container,
      headers: createMockHeaders(),
      input: { targetUserId, offset: 0, limit: 10 },
    });

    expect(result.followers).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    for (let i = 0; i < result.followers.length - 1; i++) {
      expect(result.followers[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.followers[i + 1].createdAt.getTime(),
      );
    }
  });

  it("should return empty array and totalCount 0 when no followers exist", async () => {
    const container = getContainer();
    const targetUserId = await insertUser(container.db);

    const result = await listFollowers({
      container,
      headers: createMockHeaders(),
      input: { targetUserId, offset: 0, limit: 10 },
    });

    expect(result.followers).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should return correct page with offset and limit", async () => {
    const container = getContainer();
    const targetUserId = await insertUser(container.db);
    await createFollowers(container, targetUserId, 50);

    const result = await listFollowers({
      container,
      headers: createMockHeaders(),
      input: { targetUserId, offset: 10, limit: 10 },
    });

    expect(result.followers).toHaveLength(10);
    expect(result.totalCount).toBe(50);
  });

  it("should throw ValidationError when offset is negative", async () => {
    const container = getContainer();

    await expect(
      listFollowers({
        container,
        headers: createMockHeaders(),
        input: { targetUserId: uuidv7(), offset: -1, limit: 10 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 0", async () => {
    const container = getContainer();

    await expect(
      listFollowers({
        container,
        headers: createMockHeaders(),
        input: { targetUserId: uuidv7(), offset: 0, limit: 0 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit exceeds 100", async () => {
    const container = getContainer();

    await expect(
      listFollowers({
        container,
        headers: createMockHeaders(),
        input: { targetUserId: uuidv7(), offset: 0, limit: 101 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should return 1 follower with limit minimum (1)", async () => {
    const container = getContainer();
    const targetUserId = await insertUser(container.db);
    await createFollowers(container, targetUserId, 5);

    const result = await listFollowers({
      container,
      headers: createMockHeaders(),
      input: { targetUserId, offset: 0, limit: 1 },
    });

    expect(result.followers).toHaveLength(1);
  });

  it("should return up to 100 followers with limit maximum (100)", async () => {
    const container = getContainer();
    const targetUserId = await insertUser(container.db);
    await createFollowers(container, targetUserId, 5);

    const result = await listFollowers({
      container,
      headers: createMockHeaders(),
      input: { targetUserId, offset: 0, limit: 100 },
    });

    expect(result.followers).toHaveLength(5);
    expect(result.totalCount).toBe(5);
  });

  it("should return empty array when offset equals total count", async () => {
    const container = getContainer();
    const targetUserId = await insertUser(container.db);
    await createFollowers(container, targetUserId, 5);

    const result = await listFollowers({
      container,
      headers: createMockHeaders(),
      input: { targetUserId, offset: 5, limit: 10 },
    });

    expect(result.followers).toHaveLength(0);
    expect(result.totalCount).toBe(5);
  });
});
