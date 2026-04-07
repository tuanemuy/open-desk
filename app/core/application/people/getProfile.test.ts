import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { NotFoundError } from "../error";
import { getProfile } from "./getProfile";

describe("getProfile", () => {
  const getContainer = setupTestContainer();

  const insertUser = async (
    db: ReturnType<typeof getContainer>["db"],
    overrides: Partial<typeof schema.users.$inferInsert> = {},
  ) => {
    const userId = overrides.id ?? uuidv7();
    await db.insert(schema.users).values({
      id: userId,
      loginName: overrides.loginName ?? `user-${userId}`,
      displayName: overrides.displayName ?? "Test User",
      email: overrides.email ?? `${userId}@example.com`,
      passwordHash: "hashed",
      isActive: overrides.isActive ?? true,
      primaryOrganizationId: overrides.primaryOrganizationId ?? null,
      ...overrides,
    });
    return userId;
  };

  const insertProfile = async (
    db: ReturnType<typeof getContainer>["db"],
    overrides: Partial<typeof schema.profiles.$inferInsert> & {
      userId: string;
    },
  ) => {
    const profileId = uuidv7();
    await db.insert(schema.profiles).values({
      id: profileId,
      userId: overrides.userId,
      coverImageFileKey: overrides.coverImageFileKey ?? null,
      comment: overrides.comment ?? "",
    });
    return profileId;
  };

  it("should return integrated profile DTO when user and profile exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db, {
      displayName: "Alice",
      email: "alice@example.com",
    });
    await insertProfile(container.db, {
      userId,
      comment: "Hello!",
      coverImageFileKey: "cover-key-1",
    });

    const result = await getProfile({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId },
    });

    expect(result.userId).toBe(userId);
    expect(result.displayName).toBe("Alice");
    expect(result.email).toBe("alice@example.com");
    expect(result.comment).toBe("Hello!");
    expect(result.coverImageFileKey).toBe("cover-key-1");
  });

  it("should create default profile when user exists but profile does not", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db, {
      displayName: "Bob",
      email: "bob@example.com",
    });

    const result = await getProfile({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId },
    });

    expect(result.userId).toBe(userId);
    expect(result.displayName).toBe("Bob");
    expect(result.coverImageFileKey).toBeNull();
    expect(result.comment).toBe("");
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();
    const nonExistentUserId = uuidv7();

    await expect(
      getProfile({
        container,
        headers: createMockHeaders(),
        input: { targetUserId: nonExistentUserId },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should return coverImageFileKey when cover image is set", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, {
      userId,
      coverImageFileKey: "my-cover.jpg",
    });

    const result = await getProfile({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId },
    });

    expect(result.coverImageFileKey).toBe("my-cover.jpg");
  });

  it("should return null coverImageFileKey when cover image is not set", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, {
      userId,
      coverImageFileKey: null,
    });

    const result = await getProfile({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId },
    });

    expect(result.coverImageFileKey).toBeNull();
  });

  it("should return comment when comment is set", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, {
      userId,
      comment: "My custom comment",
    });

    const result = await getProfile({
      container,
      headers: createMockHeaders(),
      input: { targetUserId: userId },
    });

    expect(result.comment).toBe("My custom comment");
  });
});
