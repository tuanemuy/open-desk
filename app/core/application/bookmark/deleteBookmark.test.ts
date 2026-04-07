import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { deleteBookmark } from "./deleteBookmark";

describe("deleteBookmark", () => {
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
    overrides: Partial<{ category: string; appId: string | null }> = {},
  ) {
    const bookmarkId = crypto.randomUUID();
    await container.db.insert(schema.bookmarks).values({
      id: bookmarkId,
      userId,
      name: "Test Bookmark",
      url: "https://example.com",
      category: overrides.category ?? "OTHER",
      appId: overrides.appId ?? null,
    });
    return bookmarkId;
  }

  it("should delete bookmark owned by the operator", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId);

    const result = await deleteBookmark({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, bookmarkId },
    });

    expect(result.bookmarkId).toBe(bookmarkId);
  });

  it("should throw NotFoundError when bookmark does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      deleteBookmark({
        container,
        headers: createMockHeaders(),
        input: { operatorId: userId, bookmarkId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when operator is not the owner", async () => {
    const container = getContainer();
    const owner = await insertUser(container);
    const otherUser = await insertUser(container);
    const bookmarkId = await insertBookmark(container, owner);

    await expect(
      deleteBookmark({
        container,
        headers: createMockHeaders(),
        input: { operatorId: otherUser, bookmarkId },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should delete APP category bookmark", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId, {
      category: "APP",
      appId: "4",
    });

    const result = await deleteBookmark({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, bookmarkId },
    });

    expect(result.bookmarkId).toBe(bookmarkId);
  });

  it("should delete SEARCH category bookmark", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId, {
      category: "SEARCH",
    });

    const result = await deleteBookmark({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, bookmarkId },
    });

    expect(result.bookmarkId).toBe(bookmarkId);
  });

  it("should delete OTHER category bookmark", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId, {
      category: "OTHER",
    });

    const result = await deleteBookmark({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, bookmarkId },
    });

    expect(result.bookmarkId).toBe(bookmarkId);
  });

  it("should throw ValidationError when operatorId is empty", async () => {
    const container = getContainer();

    await expect(
      deleteBookmark({
        container,
        headers: createMockHeaders(),
        input: { operatorId: "", bookmarkId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when bookmarkId is empty", async () => {
    const container = getContainer();

    await expect(
      deleteBookmark({
        container,
        headers: createMockHeaders(),
        input: { operatorId: crypto.randomUUID(), bookmarkId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
