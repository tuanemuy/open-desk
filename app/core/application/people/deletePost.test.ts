import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { ForbiddenError, NotFoundError } from "../error";
import { createPost } from "./createPost";
import { deletePost } from "./deletePost";

describe("deletePost", () => {
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

  it("should delete post when operator is the author", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const post = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>Post to delete</p>",
        mentions: [],
        attachmentFileKeys: [],
      },
    });

    const result = await deletePost({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, postId: post.postId },
    });

    expect(result.postId).toBe(post.postId);
  });

  it("should throw NotFoundError when post does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    await expect(
      deletePost({
        container,
        headers: createMockHeaders(),
        input: { operatorId: userId, postId: uuidv7() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when operator is not the author", async () => {
    const container = getContainer();
    const authorId = await insertUser(container.db);
    const otherId = await insertUser(container.db);

    const post = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId,
        content: "<p>Not yours</p>",
        mentions: [],
        attachmentFileKeys: [],
      },
    });

    await expect(
      deletePost({
        container,
        headers: createMockHeaders(),
        input: { operatorId: otherId, postId: post.postId },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should delete post that has mentions and attachments", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const post = await createPost({
      container,
      headers: createMockHeaders(),
      input: {
        authorId: userId,
        content: "<p>Post with extras</p>",
        mentions: [
          { type: "user", targetId: uuidv7() },
          { type: "group", targetId: uuidv7() },
        ],
        attachmentFileKeys: ["file-1", "file-2"],
      },
    });

    const result = await deletePost({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, postId: post.postId },
    });

    expect(result.postId).toBe(post.postId);
  });
});
