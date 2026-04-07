import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { deleteGroup } from "./deleteGroup";

describe("deleteGroup", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertGroup(container: ReturnType<typeof getContainer>) {
    const groupId = crypto.randomUUID();
    await container.db.insert(schema.groups).values({
      id: groupId,
      name: "Test Group",
      code: `code-${groupId}`,
    });
    return groupId;
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

  it("should delete group with no members", async () => {
    const container = getContainer();
    const groupId = await insertGroup(container);

    await expect(
      deleteGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId },
      }),
    ).resolves.toBeUndefined();
  });

  it("should throw ValidationError when groupId is empty", async () => {
    const container = getContainer();

    await expect(
      deleteGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when groupId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      deleteGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when group does not exist", async () => {
    const container = getContainer();

    await expect(
      deleteGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError when group has one member", async () => {
    const container = getContainer();
    const groupId = await insertGroup(container);
    const userId = await insertUser(container);

    await container.db.insert(schema.userGroups).values({
      userId,
      groupId,
    });

    await expect(
      deleteGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when group has multiple members", async () => {
    const container = getContainer();
    const groupId = await insertGroup(container);
    const userId1 = await insertUser(container);
    const userId2 = await insertUser(container);

    await container.db.insert(schema.userGroups).values([
      { userId: userId1, groupId },
      { userId: userId2, groupId },
    ]);

    await expect(
      deleteGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId },
      }),
    ).rejects.toThrow(ConflictError);
  });
});
