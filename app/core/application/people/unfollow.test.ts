import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { NotFoundError } from "../error";
import { follow } from "./follow";
import { unfollow } from "./unfollow";

describe("unfollow", () => {
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

  it("should delete follow relationship when one exists", async () => {
    const container = getContainer();
    const followerId = await insertUser(container.db);
    const followeeId = await insertUser(container.db);

    await follow({
      container,
      headers: createMockHeaders(),
      input: { followerId, followeeId },
    });

    const result = await unfollow({
      container,
      headers: createMockHeaders(),
      input: { followerId, followeeId },
    });

    expect(result.followerId).toBe(followerId);
    expect(result.followeeId).toBe(followeeId);
  });

  it("should throw NotFoundError when follow relationship does not exist", async () => {
    const container = getContainer();
    const followerId = await insertUser(container.db);
    const followeeId = await insertUser(container.db);

    await expect(
      unfollow({
        container,
        headers: createMockHeaders(),
        input: { followerId, followeeId },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should only delete A->B when mutual follow exists, preserving B->A", async () => {
    const container = getContainer();
    const userA = await insertUser(container.db);
    const userB = await insertUser(container.db);

    // Create mutual follow
    await follow({
      container,
      headers: createMockHeaders(),
      input: { followerId: userA, followeeId: userB },
    });
    await follow({
      container,
      headers: createMockHeaders(),
      input: { followerId: userB, followeeId: userA },
    });

    // Unfollow A -> B
    const result = await unfollow({
      container,
      headers: createMockHeaders(),
      input: { followerId: userA, followeeId: userB },
    });

    expect(result.followerId).toBe(userA);
    expect(result.followeeId).toBe(userB);

    // B -> A should still exist (unfollowing A->B should not error)
    await expect(
      unfollow({
        container,
        headers: createMockHeaders(),
        input: { followerId: userB, followeeId: userA },
      }),
    ).resolves.toBeDefined();
  });
});
