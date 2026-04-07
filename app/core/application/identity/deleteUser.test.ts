import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { deleteUser } from "./deleteUser";

describe("deleteUser", () => {
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

  async function insertSession(
    container: ReturnType<typeof getContainer>,
    userId: string,
  ) {
    const sessionId = crypto.randomUUID();
    await container.db.insert(schema.sessions).values({
      id: sessionId,
      userId,
      ipAddress: "192.168.1.1",
      userAgent: "TestBrowser/1.0",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return sessionId;
  }

  async function insertOrganization(
    container: ReturnType<typeof getContainer>,
  ) {
    const orgId = crypto.randomUUID();
    await container.db.insert(schema.organizations).values({
      id: orgId,
      name: "Test Org",
      code: `org-${orgId}`,
    });
    return orgId;
  }

  async function insertGroup(container: ReturnType<typeof getContainer>) {
    const groupId = crypto.randomUUID();
    await container.db.insert(schema.groups).values({
      id: groupId,
      name: "Test Group",
      code: `group-${groupId}`,
    });
    return groupId;
  }

  it("should delete user with no associations", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      deleteUser({
        container,
        headers: createMockHeaders(),
        input: { userId },
      }),
    ).resolves.toBeUndefined();

    const remaining = await container.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    expect(remaining).toHaveLength(0);
  });

  it("should delete user with sessions", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await insertSession(container, userId);
    await insertSession(container, userId);

    await deleteUser({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    const remainingUsers = await container.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    expect(remainingUsers).toHaveLength(0);
  });

  it("should delete user with organization memberships", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const orgId = await insertOrganization(container);

    await container.db.insert(schema.userOrganizations).values({
      userId,
      organizationId: orgId,
    });

    await deleteUser({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    const remainingUsers = await container.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    expect(remainingUsers).toHaveLength(0);
  });

  it("should delete user with group memberships", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const groupId = await insertGroup(container);

    await container.db.insert(schema.userGroups).values({
      userId,
      groupId,
    });

    await deleteUser({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    const remainingUsers = await container.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    expect(remainingUsers).toHaveLength(0);
  });

  it("should delete user with sessions, organizations, and groups", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await insertSession(container, userId);
    const orgId = await insertOrganization(container);
    const groupId = await insertGroup(container);

    await container.db.insert(schema.userOrganizations).values({
      userId,
      organizationId: orgId,
    });
    await container.db.insert(schema.userGroups).values({
      userId,
      groupId,
    });

    await deleteUser({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    const remainingUsers = await container.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    expect(remainingUsers).toHaveLength(0);
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      deleteUser({
        container,
        headers: createMockHeaders(),
        input: { userId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      deleteUser({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      deleteUser({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
