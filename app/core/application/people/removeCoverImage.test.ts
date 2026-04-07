import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { NotFoundError } from "../error";
import { removeCoverImage } from "./removeCoverImage";

describe("removeCoverImage", () => {
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

  const insertProfile = async (
    db: ReturnType<typeof getContainer>["db"],
    userId: string,
    overrides: Partial<typeof schema.profiles.$inferInsert> = {},
  ) => {
    await db.insert(schema.profiles).values({
      id: uuidv7(),
      userId,
      coverImageFileKey: null,
      comment: "",
      ...overrides,
    });
  };

  it("should remove cover image when one is set", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId, {
      coverImageFileKey: "cover.jpg",
    });

    const result = await removeCoverImage({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId },
    });

    expect(result.userId).toBe(userId);
    expect(result.coverImageFileKey).toBeNull();
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should be idempotent when cover image is not set", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId, {
      coverImageFileKey: null,
    });

    const result = await removeCoverImage({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId },
    });

    expect(result.userId).toBe(userId);
    expect(result.coverImageFileKey).toBeNull();
  });

  it("should throw NotFoundError when profile does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    await expect(
      removeCoverImage({
        container,
        headers: createMockHeaders(),
        input: { operatorId: userId },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
