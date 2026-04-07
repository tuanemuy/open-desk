import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { BusinessRuleError } from "@/core/domain/error";
import { PeopleErrorCode } from "@/core/domain/people/errorCode";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { createPost } from "./createPost";

describe("createPost", () => {
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

  it("should create post with content, mentions, and attachments", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const result = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>Hello world</p>",
        mentions: [{ type: "user", targetId: uuidv7() }],
        attachmentFileKeys: ["file-key-1"],
      },
    });

    expect(result.authorId).toBe(userId);
    expect(result.content).toBe("<p>Hello world</p>");
    expect(result.mentions).toHaveLength(1);
    expect(result.mentions[0].type).toBe("user");
    expect(result.attachmentFileKeys).toEqual(["file-key-1"]);
    expect(result.postId).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should create post with content only (no mentions, no attachments)", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const result = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>Simple post</p>",
        mentions: [],
        attachmentFileKeys: [],
      },
    });

    expect(result.authorId).toBe(userId);
    expect(result.content).toBe("<p>Simple post</p>");
    expect(result.mentions).toHaveLength(0);
    expect(result.attachmentFileKeys).toHaveLength(0);
  });

  it("should create post with mentions", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    const mentionTargetId = uuidv7();

    const result = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>Hey @someone</p>",
        mentions: [{ type: "user", targetId: mentionTargetId }],
        attachmentFileKeys: [],
      },
    });

    expect(result.mentions).toHaveLength(1);
    expect(result.mentions[0].type).toBe("user");
    expect(result.mentions[0].targetId).toBe(mentionTargetId);
  });

  it("should create post with attachments", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const result = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>With files</p>",
        mentions: [],
        attachmentFileKeys: ["file-1", "file-2"],
      },
    });

    expect(result.attachmentFileKeys).toEqual(["file-1", "file-2"]);
  });

  it("should throw BusinessRuleError when content is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    await expect(
      createPost({
        container,
        headers: createMockHeaders(),
        input: {
          authorId: userId,
          content: "",
          mentions: [],
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);

    try {
      await createPost({
        container,
        headers: createMockHeaders(),
        input: {
          authorId: userId,
          content: "",
          mentions: [],
          attachmentFileKeys: [],
        },
      });
    } catch (error) {
      expect((error as BusinessRuleError).code).toBe(
        PeopleErrorCode.EmptyPostContent,
      );
    }
  });

  it("should create post with user type mention", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const result = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>Mention user</p>",
        mentions: [{ type: "user", targetId: uuidv7() }],
        attachmentFileKeys: [],
      },
    });

    expect(result.mentions[0].type).toBe("user");
  });

  it("should create post with group type mention", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const result = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>Mention group</p>",
        mentions: [{ type: "group", targetId: uuidv7() }],
        attachmentFileKeys: [],
      },
    });

    expect(result.mentions[0].type).toBe("group");
  });

  it("should create post with organization type mention", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const result = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>Mention org</p>",
        mentions: [{ type: "organization", targetId: uuidv7() }],
        attachmentFileKeys: [],
      },
    });

    expect(result.mentions[0].type).toBe("organization");
  });

  it("should create post with multiple mentions and attachments", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const result = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>Big post</p>",
        mentions: [
          { type: "user", targetId: uuidv7() },
          { type: "group", targetId: uuidv7() },
          { type: "organization", targetId: uuidv7() },
        ],
        attachmentFileKeys: ["file-a", "file-b", "file-c"],
      },
    });

    expect(result.mentions).toHaveLength(3);
    expect(result.attachmentFileKeys).toHaveLength(3);
    expect(result.attachmentFileKeys).toEqual(["file-a", "file-b", "file-c"]);
  });
});
