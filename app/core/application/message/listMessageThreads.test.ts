import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { ForbiddenError, ValidationError } from "../error";
import { getOrCreateThread } from "./getOrCreateThread";
import { listMessageThreads } from "./listMessageThreads";
import { sendMessage } from "./sendMessage";

describe("listMessageThreads", () => {
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
      isActive: true,
      ...overrides,
    });
    return userId;
  };

  const createThreadWithMessage = async (
    container: ReturnType<typeof getContainer>,
    operatorId: string,
  ) => {
    const counterpartId = await insertUser(container.db);
    const thread = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId, counterpartId },
    });

    await sendMessage({
      container,
      headers: createMockHeaders(),
      input: {
        senderId: operatorId,
        threadId: thread.threadId,
        content: "<p>Hello</p>",
        attachmentFileKeys: [],
      },
    });

    return thread;
  };

  it("should return threads sorted by lastMessageAt newest first", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);

    await createThreadWithMessage(container, operatorId);
    await createThreadWithMessage(container, operatorId);
    await createThreadWithMessage(container, operatorId);

    const result = await listMessageThreads({
      container,
      headers: createMockHeaders(),
      input: { operatorId, offset: 0, limit: 10 },
    });

    expect(result.threads).toHaveLength(3);
    expect(result.totalCount).toBe(3);
  });

  it("should return empty array and totalCount 0 when no threads exist", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);

    const result = await listMessageThreads({
      container,
      headers: createMockHeaders(),
      input: { operatorId, offset: 0, limit: 10 },
    });

    expect(result.threads).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should return correct page with offset and limit for many threads", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);

    for (let i = 0; i < 15; i++) {
      await createThreadWithMessage(container, operatorId);
    }

    const result = await listMessageThreads({
      container,
      headers: createMockHeaders(),
      input: { operatorId, offset: 10, limit: 10 },
    });

    expect(result.threads).toHaveLength(5);
    expect(result.totalCount).toBe(15);
  });

  it("should throw ForbiddenError when message feature is disabled", async () => {
    const container = getDisabledContainer();
    const operatorId = await insertUser(container.db);

    await expect(
      listMessageThreads({
        container,
        headers: createMockHeaders(),
        input: { operatorId, offset: 0, limit: 10 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ValidationError when offset is negative", async () => {
    const container = getContainer();

    await expect(
      listMessageThreads({
        container,
        headers: createMockHeaders(),
        input: { operatorId: uuidv7(), offset: -1, limit: 10 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 0", async () => {
    const container = getContainer();

    await expect(
      listMessageThreads({
        container,
        headers: createMockHeaders(),
        input: { operatorId: uuidv7(), offset: 0, limit: 0 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit exceeds 100", async () => {
    const container = getContainer();

    await expect(
      listMessageThreads({
        container,
        headers: createMockHeaders(),
        input: { operatorId: uuidv7(), offset: 0, limit: 101 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should return 1 thread with limit minimum (1)", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    await createThreadWithMessage(container, operatorId);
    await createThreadWithMessage(container, operatorId);

    const result = await listMessageThreads({
      container,
      headers: createMockHeaders(),
      input: { operatorId, offset: 0, limit: 1 },
    });

    expect(result.threads).toHaveLength(1);
  });

  it("should return up to 100 threads with limit maximum (100)", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    await createThreadWithMessage(container, operatorId);

    const result = await listMessageThreads({
      container,
      headers: createMockHeaders(),
      input: { operatorId, offset: 0, limit: 100 },
    });

    expect(result.threads).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it("should return empty array when offset equals total count", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);

    for (let i = 0; i < 5; i++) {
      await createThreadWithMessage(container, operatorId);
    }

    const result = await listMessageThreads({
      container,
      headers: createMockHeaders(),
      input: { operatorId, offset: 5, limit: 10 },
    });

    expect(result.threads).toHaveLength(0);
    expect(result.totalCount).toBe(5);
  });

  it("should include threads with lastMessageAt null", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);

    // Create thread without sending a message (lastMessageAt = null)
    await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId, counterpartId },
    });

    const result = await listMessageThreads({
      container,
      headers: createMockHeaders(),
      input: { operatorId, offset: 0, limit: 10 },
    });

    expect(result.threads).toHaveLength(1);
    expect(result.threads[0].lastMessageAt).toBeNull();
  });
});
