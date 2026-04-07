import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { terminateSession } from "./terminateSession";

describe("terminateSession", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertUserAndSession(
    container: ReturnType<typeof getContainer>,
  ) {
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
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

    await container.db.insert(schema.sessions).values({
      id: sessionId,
      userId,
      ipAddress: "192.168.1.1",
      userAgent: "TestBrowser/1.0",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return { userId, sessionId };
  }

  it("should terminate another session of the same user", async () => {
    const container = getContainer();
    const { userId, sessionId } = await insertUserAndSession(container);

    await expect(
      terminateSession({
        container,
        headers: createMockHeaders(),
        input: { userId, sessionId },
      }),
    ).resolves.toBeUndefined();
  });

  it("should terminate the current session itself", async () => {
    const container = getContainer();
    const { userId, sessionId } = await insertUserAndSession(container);

    await expect(
      terminateSession({
        container,
        headers: createMockHeaders(),
        input: { userId, sessionId },
      }),
    ).resolves.toBeUndefined();
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      terminateSession({
        container,
        headers: createMockHeaders(),
        input: { userId: "", sessionId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      terminateSession({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid", sessionId: crypto.randomUUID() },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when sessionId is empty", async () => {
    const container = getContainer();

    await expect(
      terminateSession({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), sessionId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when sessionId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      terminateSession({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), sessionId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when session does not exist", async () => {
    const container = getContainer();
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

    await expect(
      terminateSession({
        container,
        headers: createMockHeaders(),
        input: { userId, sessionId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when trying to terminate other user's session", async () => {
    const container = getContainer();
    const { sessionId } = await insertUserAndSession(container);

    // Create another user
    const otherUserId = crypto.randomUUID();
    const hashed = await hasher.hash("password123");
    await container.db.insert(schema.users).values({
      id: otherUserId,
      loginName: `other-${otherUserId}@example.com`,
      displayName: "Other User",
      email: `other-${otherUserId}@example.com`,
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });

    await expect(
      terminateSession({
        container,
        headers: createMockHeaders(),
        input: { userId: otherUserId, sessionId },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
