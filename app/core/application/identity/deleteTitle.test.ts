import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { deleteTitle } from "./deleteTitle";

describe("deleteTitle", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertTitle(container: ReturnType<typeof getContainer>) {
    const titleId = crypto.randomUUID();
    await container.db.insert(schema.titles).values({
      id: titleId,
      name: `Title ${titleId}`,
      orderIndex: 0,
    });
    return titleId;
  }

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

  it("should delete title with no assigned users", async () => {
    const container = getContainer();
    const titleId = await insertTitle(container);

    await expect(
      deleteTitle({
        container,
        headers: createMockHeaders(),
        input: { titleId },
      }),
    ).resolves.toBeUndefined();
  });

  it("should throw ValidationError when titleId is empty", async () => {
    const container = getContainer();

    await expect(
      deleteTitle({
        container,
        headers: createMockHeaders(),
        input: { titleId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when titleId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      deleteTitle({
        container,
        headers: createMockHeaders(),
        input: { titleId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when title does not exist", async () => {
    const container = getContainer();

    await expect(
      deleteTitle({
        container,
        headers: createMockHeaders(),
        input: { titleId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError when title has one assigned user", async () => {
    const container = getContainer();
    const titleId = await insertTitle(container);
    const userId = await insertUser(container);

    await container.db.insert(schema.userTitles).values({
      userId,
      titleId,
    });

    await expect(
      deleteTitle({
        container,
        headers: createMockHeaders(),
        input: { titleId },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when title has multiple assigned users", async () => {
    const container = getContainer();
    const titleId = await insertTitle(container);
    const userId1 = await insertUser(container);
    const userId2 = await insertUser(container);

    await container.db.insert(schema.userTitles).values([
      { userId: userId1, titleId },
      { userId: userId2, titleId },
    ]);

    await expect(
      deleteTitle({
        container,
        headers: createMockHeaders(),
        input: { titleId },
      }),
    ).rejects.toThrow(ConflictError);
  });
});
