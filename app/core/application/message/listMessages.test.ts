import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { ForbiddenError, NotFoundError, ValidationError } from "../error";
import { getOrCreateThread } from "./getOrCreateThread";
import { listMessages } from "./listMessages";
import { sendMessage } from "./sendMessage";

describe("listMessages", () => {
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

  const createThreadAndMessages = async (
    container: ReturnType<typeof getContainer>,
    senderId: string,
    counterpartId: string,
    messageCount: number,
  ) => {
    const thread = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId: senderId, counterpartId },
    });

    for (let i = 0; i < messageCount; i++) {
      await sendMessage({
        container,
        headers: createMockHeaders(),
        input: {
          senderId,
          threadId: thread.threadId,
          content: `<p>Message ${i + 1}</p>`,
          attachmentFileKeys: [],
        },
      });
    }

    return thread;
  };

  it("should return messages in newest-first order with totalCount", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThreadAndMessages(
      container,
      operatorId,
      counterpartId,
      5,
    );

    const result = await listMessages({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        threadId: thread.threadId,
        offset: 0,
        limit: 10,
      },
    });

    expect(result.messages).toHaveLength(5);
    expect(result.totalCount).toBe(5);
    for (let i = 0; i < result.messages.length - 1; i++) {
      expect(result.messages[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.messages[i + 1].createdAt.getTime(),
      );
    }
  });

  it("should return empty array and totalCount 0 when no messages exist", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId, counterpartId },
    });

    const result = await listMessages({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        threadId: thread.threadId,
        offset: 0,
        limit: 10,
      },
    });

    expect(result.messages).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should return correct page with offset and limit for many messages", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThreadAndMessages(
      container,
      operatorId,
      counterpartId,
      50,
    );

    const result = await listMessages({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        threadId: thread.threadId,
        offset: 10,
        limit: 10,
      },
    });

    expect(result.messages).toHaveLength(10);
    expect(result.totalCount).toBe(50);
  });

  it("should throw ForbiddenError when message feature is disabled", async () => {
    const container = getDisabledContainer();
    const operatorId = await insertUser(container.db);

    await expect(
      listMessages({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId,
          threadId: uuidv7(),
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError when thread does not exist", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);

    await expect(
      listMessages({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId,
          threadId: uuidv7(),
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when operator is not a participant", async () => {
    const container = getContainer();
    const userA = await insertUser(container.db);
    const userB = await insertUser(container.db);
    const outsider = await insertUser(container.db);
    const thread = await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userA, counterpartId: userB },
    });

    await expect(
      listMessages({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: outsider,
          threadId: thread.threadId,
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ValidationError when offset is negative", async () => {
    const container = getContainer();

    await expect(
      listMessages({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          threadId: uuidv7(),
          offset: -1,
          limit: 10,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 0", async () => {
    const container = getContainer();

    await expect(
      listMessages({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          threadId: uuidv7(),
          offset: 0,
          limit: 0,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit exceeds 100", async () => {
    const container = getContainer();

    await expect(
      listMessages({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          threadId: uuidv7(),
          offset: 0,
          limit: 101,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should return 1 message with limit minimum (1)", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThreadAndMessages(
      container,
      operatorId,
      counterpartId,
      5,
    );

    const result = await listMessages({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        threadId: thread.threadId,
        offset: 0,
        limit: 1,
      },
    });

    expect(result.messages).toHaveLength(1);
  });

  it("should return up to 100 messages with limit maximum (100)", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThreadAndMessages(
      container,
      operatorId,
      counterpartId,
      5,
    );

    const result = await listMessages({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        threadId: thread.threadId,
        offset: 0,
        limit: 100,
      },
    });

    expect(result.messages).toHaveLength(5);
    expect(result.totalCount).toBe(5);
  });

  it("should return empty array when offset equals total count", async () => {
    const container = getContainer();
    const operatorId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThreadAndMessages(
      container,
      operatorId,
      counterpartId,
      5,
    );

    const result = await listMessages({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        threadId: thread.threadId,
        offset: 5,
        limit: 10,
      },
    });

    expect(result.messages).toHaveLength(0);
    expect(result.totalCount).toBe(5);
  });
});
