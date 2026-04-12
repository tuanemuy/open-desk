import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { createBookmark } from "./createBookmark";

describe("createBookmark", () => {
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

  it("should create bookmark with valid name and url", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await createBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        name: "My Bookmark",
        url: "https://example.com",
      },
    });

    expect(result.bookmarkId).toBeDefined();
    expect(result.userId).toBe(userId);
    expect(result.name).toBe("My Bookmark");
    expect(result.url).toBe("https://example.com");
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should categorize app URL as APP", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await createBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        name: "App Bookmark",
        url: "https://example.com/apps/abc123",
      },
    });

    expect(result.category).toBe("APP");
    expect(result.appId).toBeDefined();
  });

  it("should categorize search URL as SEARCH", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await createBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        name: "Search Bookmark",
        url: "https://example.com/search?keyword=test",
      },
    });

    expect(result.category).toBe("SEARCH");
    expect(result.appId).toBeNull();
  });

  it("should categorize other URL as OTHER", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await createBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        name: "Other Bookmark",
        url: "https://example.com/other",
      },
    });

    expect(result.category).toBe("OTHER");
    expect(result.appId).toBeNull();
  });

  it("should throw error when name is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      createBookmark({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          name: "",
          url: "https://example.com",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when url is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      createBookmark({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          name: "Test",
          url: "",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should allow multiple bookmarks with same URL", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result1 = await createBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        name: "Bookmark 1",
        url: "https://example.com",
      },
    });

    const result2 = await createBookmark({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        name: "Bookmark 2",
        url: "https://example.com",
      },
    });

    expect(result1.bookmarkId).not.toBe(result2.bookmarkId);
  });
});
