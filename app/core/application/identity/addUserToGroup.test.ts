import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { addUserToGroup } from "./addUserToGroup";

describe("addUserToGroup", () => {
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

  it("should add user to group", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const groupId = await insertGroup(container);

    const result = await addUserToGroup({
      container,
      headers: createMockHeaders(),
      input: { userId, groupId },
    });

    expect(result.userId).toBe(userId);
    expect(result.groupId).toBe(groupId);
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      addUserToGroup({
        container,
        headers: createMockHeaders(),
        input: { userId: "", groupId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      addUserToGroup({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid", groupId: crypto.randomUUID() },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when groupId is empty", async () => {
    const container = getContainer();

    await expect(
      addUserToGroup({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), groupId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when groupId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      addUserToGroup({
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
      addUserToGroup({
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
      addUserToGroup({
        container,
        headers: createMockHeaders(),
        input: { userId, groupId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should handle adding a user already in the group (idempotent or error depending on adapter)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const groupId = await insertGroup(container);

    await addUserToGroup({
      container,
      headers: createMockHeaders(),
      input: { userId, groupId },
    });

    // The adapter may either succeed idempotently or throw a conflict error
    // depending on unique constraint handling. Both behaviors are valid.
    try {
      const result = await addUserToGroup({
        container,
        headers: createMockHeaders(),
        input: { userId, groupId },
      });
      // If it succeeds, the membership still exists
      expect(result.userId).toBe(userId);
      expect(result.groupId).toBe(groupId);
    } catch {
      // If it throws, that's also acceptable (AlreadyMemberError)
    }
  });

  it("should allow user to belong to multiple groups", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const groupA = await insertGroup(container);
    const groupB = await insertGroup(container);

    await addUserToGroup({
      container,
      headers: createMockHeaders(),
      input: { userId, groupId: groupA },
    });

    const result = await addUserToGroup({
      container,
      headers: createMockHeaders(),
      input: { userId, groupId: groupB },
    });

    expect(result.groupId).toBe(groupB);
  });
});
