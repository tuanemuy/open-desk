import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updateBookmark } from "./updateBookmark";

describe("updateBookmark", () => {
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
    }> = {},
  ) {
    const bookmarkId = crypto.randomUUID();
    await container.db.insert(schema.bookmarks).values({
      id: bookmarkId,
      userId,
      name: overrides.name ?? "Test Bookmark",
      url: overrides.url ?? "https://example.com/other",
      category: overrides.category ?? "OTHER",
      appId: overrides.appId ?? null,
    });
    return bookmarkId;
  }

  it("should update name only", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId);

    const result = await updateBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        bookmarkId,
        name: "Updated Name",
      },
    });

    expect(result.name).toBe("Updated Name");
    expect(result.url).toBe("https://example.com/other");
  });

  it("should update url and re-categorize", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId);

    const result = await updateBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        bookmarkId,
        url: "https://example.com/search?q=test",
      },
    });

    expect(result.category).toBe("SEARCH");
  });

  it("should update both name and url", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId);

    const result = await updateBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        bookmarkId,
        name: "New Name",
        url: "https://example.com/apps/app5",
      },
    });

    expect(result.name).toBe("New Name");
    expect(result.url).toBe("https://example.com/apps/app5");
    expect(result.category).toBe("APP");
    expect(result.appId).toBeDefined();
  });

  it("should re-categorize to APP when url changed to app url", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId, {
      category: "OTHER",
    });

    const result = await updateBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        bookmarkId,
        url: "https://example.com/apps/app10",
      },
    });

    expect(result.category).toBe("APP");
    expect(result.appId).toBeDefined();
  });

  it("should set appId to null when url changed to non-app url", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId, {
      url: "https://example.com/apps/app5",
      category: "APP",
      appId: "app5",
    });

    const result = await updateBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        bookmarkId,
        url: "https://example.com/other",
      },
    });

    expect(result.category).toBe("OTHER");
    expect(result.appId).toBeNull();
  });

  it("should throw NotFoundError when bookmark does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      updateBookmark({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: userId,
          bookmarkId: crypto.randomUUID(),
          name: "Test",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when operator is not the owner", async () => {
    const container = getContainer();
    const owner = await insertUser(container);
    const otherUser = await insertUser(container);
    const bookmarkId = await insertBookmark(container, owner);

    await expect(
      updateBookmark({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: otherUser,
          bookmarkId,
          name: "Test",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BusinessRuleError when name is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId);

    await expect(
      updateBookmark({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: userId,
          bookmarkId,
          name: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when url is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId);

    await expect(
      updateBookmark({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: userId,
          bookmarkId,
          url: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should return current bookmark when neither name nor url is specified", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const bookmarkId = await insertBookmark(container, userId, {
      name: "Original",
      url: "https://example.com/original",
    });

    const result = await updateBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        bookmarkId,
      },
    });

    expect(result.name).toBe("Original");
    expect(result.url).toBe("https://example.com/original");
  });

  it("should throw ValidationError when operatorId is empty", async () => {
    const container = getContainer();

    await expect(
      updateBookmark({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: "",
          bookmarkId: crypto.randomUUID(),
          name: "Test",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when bookmarkId is empty", async () => {
    const container = getContainer();

    await expect(
      updateBookmark({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: crypto.randomUUID(),
          bookmarkId: "",
          name: "Test",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
