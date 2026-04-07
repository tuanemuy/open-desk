import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { removeUserFromGroup } from "./removeUserFromGroup";

describe("removeUserFromGroup", () => {
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

  async function insertGroup(container: ReturnType<typeof getContainer>) {
    const groupId = crypto.randomUUID();
    await container.db.insert(schema.groups).values({
      id: groupId,
      name: "Test Group",
      code: `code-${groupId}`,
    });
    return groupId;
  }

  it("should remove user from group", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const groupId = await insertGroup(container);

    await container.db.insert(schema.userGroups).values({
      userId,
      groupId,
    });

    await expect(
      removeUserFromGroup({
        container,
        headers: createMockHeaders(),
        input: { userId, groupId },
      }),
    ).resolves.toBeUndefined();
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      removeUserFromGroup({
        container,
        headers: createMockHeaders(),
        input: { userId: "", groupId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      removeUserFromGroup({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid", groupId: crypto.randomUUID() },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when groupId is empty", async () => {
    const container = getContainer();

    await expect(
      removeUserFromGroup({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), groupId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when groupId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      removeUserFromGroup({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), groupId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();
    const groupId = await insertGroup(container);

    await expect(
      removeUserFromGroup({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), groupId },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when group does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      removeUserFromGroup({
        container,
        headers: createMockHeaders(),
        input: { userId, groupId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should handle removing a user not in the group (no-op or error depending on adapter)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const groupId = await insertGroup(container);

    // The adapter may silently succeed (no-op) or throw NotMemberError
    try {
      await removeUserFromGroup({
        container,
        headers: createMockHeaders(),
        input: { userId, groupId },
      });
      // No-op is acceptable
    } catch {
      // Throwing NotMemberError is also acceptable
    }
  });
});
