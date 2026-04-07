import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { ForbiddenError, ValidationError } from "../error";
import { getOrCreateThread } from "./getOrCreateThread";

describe("getOrCreateThread", () => {
  const getContainer = setupTestContainer();
  const getDisabledContainer = setupTestContainer({
    config: { features: { peopleAndMessageEnabled: false } },
  });

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
      isActive: overrides.isActive ?? true,
      ...overrides,
    });
    return userId;
  };

  it("should create new thread when none exists between two active users", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);

    const result = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId, counterpartId },
    });

    expect(result.threadId).toBeDefined();
    expect(result.participantIds).toContain(operatorId);
    expect(result.participantIds).toContain(counterpartId);
    expect(result.lastMessageAt).toBeNull();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should return existing thread when one already exists", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);

    const first = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId, counterpartId },
    });

    const second = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId, counterpartId },
    });

    expect(first.threadId).toBe(second.threadId);
  });

  it("should throw ForbiddenError when message feature is disabled", async () => {
    const container = getDisabledContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);

    await expect(
      getOrCreateThread({
        container,
        headers: createMockHeaders(),
        input: { operatorId, counterpartId },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ValidationError when counterpart is inactive (guest user)", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const guestId = await insertUser(container.db, { isActive: false });

    await expect(
      getOrCreateThread({
        container,
        headers: createMockHeaders(),
        input: { operatorId, counterpartId: guestId },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when operatorId and counterpartId are the same", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    await expect(
      getOrCreateThread({
        container,
        headers: createMockHeaders(),
        input: { operatorId: userId, counterpartId: userId },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should be idempotent - returns same thread on repeated calls with same pair", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);

    const result1 = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId, counterpartId },
    });

    const result2 = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId, counterpartId },
    });

    const result3 = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId: counterpartId, counterpartId: operatorId },
    });

    expect(result1.threadId).toBe(result2.threadId);
    expect(result1.threadId).toBe(result3.threadId);
  });
});
