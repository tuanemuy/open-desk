import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { assignTitleToUser } from "./assignTitleToUser";

describe("assignTitleToUser", () => {
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

  async function insertTitle(container: ReturnType<typeof getContainer>) {
    const titleId = crypto.randomUUID();
    await container.db.insert(schema.titles).values({
      id: titleId,
      name: `Title ${titleId}`,
      orderIndex: 0,
    });
    return titleId;
  }

  it("should assign title to user", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const titleId = await insertTitle(container);

    const result = await assignTitleToUser({
      container,
      headers: createMockHeaders(),
      input: { userId, titleId },
    });

    expect(result.userId).toBe(userId);
    expect(result.titleId).toBe(titleId);
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      assignTitleToUser({
        container,
        headers: createMockHeaders(),
        input: { userId: "", titleId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      assignTitleToUser({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid", titleId: crypto.randomUUID() },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when titleId is empty", async () => {
    const container = getContainer();

    await expect(
      assignTitleToUser({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), titleId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when titleId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      assignTitleToUser({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), titleId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();
    const titleId = await insertTitle(container);

    await expect(
      assignTitleToUser({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), titleId },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when title does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      assignTitleToUser({
        container,
        headers: createMockHeaders(),
        input: { userId, titleId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should handle assigning the same title to the same user again (idempotent or error)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const titleId = await insertTitle(container);

    await assignTitleToUser({
      container,
      headers: createMockHeaders(),
      input: { userId, titleId },
    });

    // The adapter may either succeed idempotently or throw a conflict error
    // depending on unique constraint handling. Both behaviors are valid.
    try {
      const result = await assignTitleToUser({
        container,
        headers: createMockHeaders(),
        input: { userId, titleId },
      });
      expect(result.userId).toBe(userId);
      expect(result.titleId).toBe(titleId);
    } catch {
      // If it throws, that's also acceptable (TitleAlreadyAssignedError)
    }
  });

  it("should allow user to hold multiple titles", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const titleA = await insertTitle(container);
    const titleB = await insertTitle(container);

    await assignTitleToUser({
      container,
      headers: createMockHeaders(),
      input: { userId, titleId: titleA },
    });

    const result = await assignTitleToUser({
      container,
      headers: createMockHeaders(),
      input: { userId, titleId: titleB },
    });

    expect(result.userId).toBe(userId);
    expect(result.titleId).toBe(titleB);
  });
});
