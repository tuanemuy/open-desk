import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { BusinessRuleError } from "@/core/domain/error";
import { PeopleErrorCode } from "@/core/domain/people/errorCode";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { ConflictError } from "../error";
import { follow } from "./follow";

describe("follow", () => {
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

  it("should create follow relationship when one does not exist", async () => {
    const container = getContainer();
    const followerId = await insertUser(container.db);
    const followeeId = await insertUser(container.db);

    const result = await follow({
      container,
      headers: createMockHeaders(),
      input: { followerId, followeeId },
    });

    expect(result.followerId).toBe(followerId);
    expect(result.followeeId).toBe(followeeId);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should throw BusinessRuleError for self-follow", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    await expect(
      follow({
        container,
        headers: createMockHeaders(),
        input: { followerId: userId, followeeId: userId },
      }),
    ).rejects.toThrow(BusinessRuleError);

    try {
      await follow({
        container,
        headers: createMockHeaders(),
        input: { followerId: userId, followeeId: userId },
      });
    } catch (error) {
      expect((error as BusinessRuleError).code).toBe(
        PeopleErrorCode.SelfFollow,
      );
    }
  });

  it("should throw ConflictError for duplicate follow", async () => {
    const container = getContainer();
    const followerId = await insertUser(container.db);
    const followeeId = await insertUser(container.db);

    await follow({
      container,
      headers: createMockHeaders(),
      input: { followerId, followeeId },
    });

    await expect(
      follow({
        container,
        headers: createMockHeaders(),
        input: { followerId, followeeId },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should allow mutual follow (A follows B, then B follows A)", async () => {
    const container = getContainer();
    const userA = await insertUser(container.db);
    const userB = await insertUser(container.db);

    await follow({
      container,
      headers: createMockHeaders(),
      input: { followerId: userA, followeeId: userB },
    });

    const result = await follow({
      container,
      headers: createMockHeaders(),
      input: { followerId: userB, followeeId: userA },
    });

    expect(result.followerId).toBe(userB);
    expect(result.followeeId).toBe(userA);
  });
});
