import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { NotFoundError } from "../error";
import { updateComment } from "./updateComment";

describe("updateComment", () => {
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
      comment: overrides.comment ?? "",
      ...overrides,
    });
  };

  it("should update comment when profile exists with existing comment", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId, { comment: "old comment" });

    const result = await updateComment({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, comment: "new comment" },
    });

    expect(result.userId).toBe(userId);
    expect(result.comment).toBe("new comment");
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should clear comment with empty string", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId, { comment: "existing comment" });

    const result = await updateComment({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, comment: "" },
    });

    expect(result.comment).toBe("");
  });

  it("should set comment when current comment is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId, { comment: "" });

    const result = await updateComment({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, comment: "brand new comment" },
    });

    expect(result.comment).toBe("brand new comment");
  });

  it("should throw NotFoundError when profile does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);

    await expect(
      updateComment({
        container,
        headers: createMockHeaders(),
        input: { operatorId: userId, comment: "some comment" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should update updatedAt even when same comment is set", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId, { comment: "same comment" });

    const result = await updateComment({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, comment: "same comment" },
    });

    expect(result.comment).toBe("same comment");
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});
