import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { BusinessRuleError } from "@/core/domain/error";
import { MessageErrorCode } from "@/core/domain/message/errorCode";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { ForbiddenError, NotFoundError, ValidationError } from "../error";
import { getOrCreateThread } from "./getOrCreateThread";
import { sendMessage } from "./sendMessage";

describe("sendMessage", () => {
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

  const createThread = async (
    container: ReturnType<typeof getContainer>,
    operatorId: string,
    counterpartId: string,
  ) => {
    return await getOrCreateThread({
      container,
      headers: createMockHeaders(),
      input: { operatorId, counterpartId },
    });
  };

  it("should send message when sender is a participant", async () => {
    const container = getContainer();
    const senderId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThread(container, senderId, counterpartId);

    const result = await sendMessage({
      container,
      headers: createMockHeaders(),
      input: {
        senderId,
        threadId: thread.threadId,
        content: "<p>Hello!</p>",
        attachmentFileKeys: [],
      },
    });

    expect(result.messageId).toBeDefined();
    expect(result.threadId).toBe(thread.threadId);
    expect(result.senderId).toBe(senderId);
    expect(result.content).toBe("<p>Hello!</p>");
    expect(result.attachmentFileKeys).toHaveLength(0);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should send message with attachments", async () => {
    const container = getContainer();
    const senderId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThread(container, senderId, counterpartId);

    const result = await sendMessage({
      container,
      headers: createMockHeaders(),
      input: {
        senderId,
        threadId: thread.threadId,
        content: "<p>With files</p>",
        attachmentFileKeys: ["file-key-1", "file-key-2"],
      },
    });

    expect(result.attachmentFileKeys).toEqual(["file-key-1", "file-key-2"]);
  });

  it("should throw ForbiddenError when message feature is disabled", async () => {
    const container = getDisabledContainer();
    const senderId = await insertUser(container.db);

    await expect(
      sendMessage({
        container,
        headers: createMockHeaders(),
        input: {
          senderId,
          threadId: uuidv7(),
          content: "<p>Test</p>",
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError when thread does not exist", async () => {
    const container = getContainer();
    const senderId = await insertUser(container.db);

    await expect(
      sendMessage({
        container,
        headers: createMockHeaders(),
        input: {
          senderId,
          threadId: uuidv7(),
          content: "<p>Test</p>",
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when sender is not a participant", async () => {
    const container = getContainer();
    const userA = await insertUser(container.db);
    const userB = await insertUser(container.db);
    const outsider = await insertUser(container.db);
    const thread = await createThread(container, userA, userB);

    await expect(
      sendMessage({
        container,
        headers: createMockHeaders(),
        input: {
          senderId: outsider,
          threadId: thread.threadId,
          content: "<p>Intruder</p>",
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ValidationError when content is empty", async () => {
    const container = getContainer();
    const senderId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThread(container, senderId, counterpartId);

    await expect(
      sendMessage({
        container,
        headers: createMockHeaders(),
        input: {
          senderId,
          threadId: thread.threadId,
          content: "",
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw BusinessRuleError when content contains iframe tag", async () => {
    const container = getContainer();
    const senderId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThread(container, senderId, counterpartId);

    await expect(
      sendMessage({
        container,
        headers: createMockHeaders(),
        input: {
          senderId,
          threadId: thread.threadId,
          content: '<iframe src="evil.com"></iframe>',
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);

    try {
      await sendMessage({
        container,
        headers: createMockHeaders(),
        input: {
          senderId,
          threadId: thread.threadId,
          content: '<iframe src="evil.com"></iframe>',
          attachmentFileKeys: [],
        },
      });
    } catch (error) {
      expect((error as BusinessRuleError).code).toBe(
        MessageErrorCode.InvalidRichTextHtml,
      );
    }
  });

  it("should throw BusinessRuleError when content contains opendesk-app tag", async () => {
    const container = getContainer();
    const senderId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThread(container, senderId, counterpartId);

    await expect(
      sendMessage({
        container,
        headers: createMockHeaders(),
        input: {
          senderId,
          threadId: thread.threadId,
          content: "<opendesk-app>embedded</opendesk-app>",
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed with sanitized HTML content", async () => {
    const container = getContainer();
    const senderId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThread(container, senderId, counterpartId);

    const result = await sendMessage({
      container,
      headers: createMockHeaders(),
      input: {
        senderId,
        threadId: thread.threadId,
        content: "<p>Hello <b>world</b></p><ul><li>item 1</li></ul>",
        attachmentFileKeys: [],
      },
    });

    expect(result.content).toBe(
      "<p>Hello <b>world</b></p><ul><li>item 1</li></ul>",
    );
  });

  it("should update lastMessageAt when sending consecutive messages", async () => {
    const container = getContainer();
    const senderId = await insertUser(container.db);
    const counterpartId = await insertUser(container.db);
    const thread = await createThread(container, senderId, counterpartId);

    const msg1 = await sendMessage({
      container,
      headers: createMockHeaders(),
      input: {
        senderId,
        threadId: thread.threadId,
        content: "<p>First</p>",
        attachmentFileKeys: [],
      },
    });

    const msg2 = await sendMessage({
      container,
      headers: createMockHeaders(),
      input: {
        senderId,
        threadId: thread.threadId,
        content: "<p>Second</p>",
        attachmentFileKeys: [],
      },
    });

    expect(msg1.messageId).not.toBe(msg2.messageId);
    expect(msg2.createdAt.getTime()).toBeGreaterThanOrEqual(
      msg1.createdAt.getTime(),
    );
  });
});
