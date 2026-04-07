import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { listBookmarksByCategory } from "./listBookmarksByCategory";

describe("listBookmarksByCategory", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertUser(container: ReturnType<typeof getContainer>) {
    const userId = crypto.randomUUID();
    const hashed = await hasher.hash("password123");
    await container.db.insert(schema.users).values({
      id: userId,
      loginName: `user-${userId}@example.com`,
      displayName: "Test User",
      email: `user-${userId}@example.com`,
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });
    return userId;
  }

  async function insertBookmark(
    container: ReturnType<typeof getContainer>,
    userId: string,
    overrides: Partial<{
      name: string;
      url: string;
      category: string;
      appId: string | null;
      createdAt: Date;
    }> = {},
  ) {
    const bookmarkId = crypto.randomUUID();
    await container.db.insert(schema.bookmarks).values({
      id: bookmarkId,
      userId,
      name: overrides.name ?? "Test Bookmark",
      url: overrides.url ?? "https://example.com",
      category: overrides.category ?? "OTHER",
      appId: overrides.appId ?? null,
      createdAt: overrides.createdAt ?? new Date(),
    });
    return bookmarkId;
  }

  it("should return bookmarks grouped by category", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await insertBookmark(container, userId, {
      category: "APP",
      appId: "1",
      url: "https://example.com/apps/1",
    });
    await insertBookmark(container, userId, {
      category: "SEARCH",
      url: "https://example.com/search",
    });
    await insertBookmark(container, userId, {
      category: "OTHER",
      url: "https://example.com/other",
    });

    const result = await listBookmarksByCategory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.app.length).toBe(1);
    expect(result.search.length).toBe(1);
    expect(result.other.length).toBe(1);
  });

  it("should return all empty when user has no bookmarks", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await listBookmarksByCategory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.app).toHaveLength(0);
    expect(result.search).toHaveLength(0);
    expect(result.other).toHaveLength(0);
  });

  it("should return APP only when user has only APP bookmarks", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await insertBookmark(container, userId, {
      category: "APP",
      appId: "1",
    });

    const result = await listBookmarksByCategory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.app.length).toBe(1);
    expect(result.search).toHaveLength(0);
    expect(result.other).toHaveLength(0);
  });

  it("should return SEARCH only when user has only SEARCH bookmarks", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await insertBookmark(container, userId, { category: "SEARCH" });

    const result = await listBookmarksByCategory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.app).toHaveLength(0);
    expect(result.search.length).toBe(1);
    expect(result.other).toHaveLength(0);
  });

  it("should return OTHER only when user has only OTHER bookmarks", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await insertBookmark(container, userId, { category: "OTHER" });

    const result = await listBookmarksByCategory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.app).toHaveLength(0);
    expect(result.search).toHaveLength(0);
    expect(result.other.length).toBe(1);
  });

  it("should not include other user's bookmarks", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const otherUserId = await insertUser(container);

    await insertBookmark(container, userId, { category: "OTHER" });
    await insertBookmark(container, otherUserId, { category: "OTHER" });

    const result = await listBookmarksByCategory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.other.length).toBe(1);
  });
});
