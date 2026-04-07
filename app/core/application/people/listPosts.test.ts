import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { ValidationError } from "../error";
import { createPost } from "./createPost";
import { listPosts } from "./listPosts";

describe("listPosts", () => {
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

  const createPosts = async (
    container: ReturnType<typeof getContainer>,
    authorId: string,
    count: number,
  ) => {
    const posts = [];
    for (let i = 0; i < count; i++) {
      const post = await createPost({
        container,
        headers: createMockHeaders(),
        input: {
          authorId,
          content: `<p>Post ${i + 1}</p>`,
          mentions: [],
          attachmentFileKeys: [],
        },
      });
      posts.push(post);
    }
    return posts;
  };

  it("should return posts in newest-first order with totalCount", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await createPosts(container, userId, 3);

    const result = await listPosts({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId, offset: 0, limit: 10 },
    });

    expect(result.posts).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    // Newest first
    for (let i = 0; i < result.posts.length - 1; i++) {
      expect(result.posts[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.posts[i + 1].createdAt.getTime(),
      );
    }
  });

  it("should return empty array and totalCount 0 when no posts exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    const result = await listPosts({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId, offset: 0, limit: 10 },
    });

    expect(result.posts).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should return correct page with offset and limit", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await createPosts(container, userId, 50);

    const result = await listPosts({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId, offset: 10, limit: 10 },
    });

    expect(result.posts).toHaveLength(10);
    expect(result.totalCount).toBe(50);
  });

  it("should return all posts when limit exceeds total count", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await createPosts(container, userId, 5);

    const result = await listPosts({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId, offset: 0, limit: 100 },
    });

    expect(result.posts).toHaveLength(5);
    expect(result.totalCount).toBe(5);
  });

  it("should throw ValidationError when offset is negative", async () => {
    const container = getContainer();

    await expect(
      listPosts({
        container,
        headers: createMockHeaders(),
        input: { targetUserId: uuidv7(), offset: -1, limit: 10 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 0", async () => {
    const container = getContainer();

    await expect(
      listPosts({
        container,
        headers: createMockHeaders(),
        input: { targetUserId: uuidv7(), offset: 0, limit: 0 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit exceeds 100", async () => {
    const container = getContainer();

    await expect(
      listPosts({
        container,
        headers: createMockHeaders(),
        input: { targetUserId: uuidv7(), offset: 0, limit: 101 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should return 1 post with limit minimum (1)", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await createPosts(container, userId, 5);

    const result = await listPosts({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId, offset: 0, limit: 1 },
    });

    expect(result.posts).toHaveLength(1);
  });

  it("should return up to 100 posts with limit maximum (100)", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await createPosts(container, userId, 5);

    const result = await listPosts({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId, offset: 0, limit: 100 },
    });

    expect(result.posts).toHaveLength(5);
    expect(result.totalCount).toBe(5);
  });

  it("should return empty array when offset equals total count", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await createPosts(container, userId, 5);

    const result = await listPosts({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId, offset: 5, limit: 10 },
    });

    expect(result.posts).toHaveLength(0);
    expect(result.totalCount).toBe(5);
  });

  it("should return empty array when offset exceeds total count", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await createPosts(container, userId, 5);

    const result = await listPosts({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId, offset: 100, limit: 10 },
    });

    expect(result.posts).toHaveLength(0);
    expect(result.totalCount).toBe(5);
  });
});
