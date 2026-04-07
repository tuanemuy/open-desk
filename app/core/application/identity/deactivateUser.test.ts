import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { deactivateUser } from "./deactivateUser";

describe("deactivateUser", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertUser(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<{ id: string; isActive: boolean }> = {},
  ) {
    const userId = overrides.id ?? crypto.randomUUID();
    const hashed = await hasher.hash("password123");

    await container.db.insert(schema.users).values({
      id: userId,
      loginName: `user-${userId}@example.com`,
      displayName: "Test User",
      email: `user-${userId}@example.com`,
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: overrides.isActive ?? true,
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

  it("should deactivate an active user", async () => {
    const container = getContainer();
    const userId = await insertUser(container, { isActive: true });

    const result = await deactivateUser({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.userId).toBe(userId);
    expect(result.isActive).toBe(false);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      deactivateUser({
        container,
        headers: createMockHeaders(),
        input: { userId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      deactivateUser({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      deactivateUser({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when user is already inactive", async () => {
    const container = getContainer();
    const userId = await insertUser(container, { isActive: false });

    await expect(
      deactivateUser({
        container,
        headers: createMockHeaders(),
        input: { userId },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should terminate all sessions when deactivating user with sessions", async () => {
    const container = getContainer();
    const userId = await insertUser(container, { isActive: true });
    await insertSession(container, userId);
    await insertSession(container, userId);

    await deactivateUser({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    // Verify sessions are deleted
    const remainingSessions = await container.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, userId));
    expect(remainingSessions).toHaveLength(0);
  });

  it("should deactivate user without sessions normally", async () => {
    const container = getContainer();
    const userId = await insertUser(container, { isActive: true });

    const result = await deactivateUser({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.isActive).toBe(false);
  });
});
