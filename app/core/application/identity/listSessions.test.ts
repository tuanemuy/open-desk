import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { listSessions } from "./listSessions";

describe("listSessions", () => {
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
    overrides: Partial<{
      id: string;
      createdAt: Date;
      expiresAt: Date;
    }> = {},
  ) {
    const sessionId = overrides.id ?? crypto.randomUUID();
    const now = new Date();
    await container.db.insert(schema.sessions).values({
      id: sessionId,
      userId,
      ipAddress: "192.168.1.1",
      userAgent: "TestBrowser/1.0",
      createdAt: overrides.createdAt ?? now,
      expiresAt:
        overrides.expiresAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000),
    });
    return sessionId;
  }

  it("should return 3 active sessions sorted by createdAt desc", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    await insertSession(container, userId, {
      createdAt: new Date(now - 3000),
    });
    await insertSession(container, userId, {
      createdAt: new Date(now - 2000),
    });
    await insertSession(container, userId, {
      createdAt: new Date(now - 1000),
    });

    const result = await listSessions({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.sessions).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    // Verify descending order
    for (let i = 0; i < result.sessions.length - 1; i++) {
      expect(result.sessions[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.sessions[i + 1].createdAt.getTime(),
      );
    }
  });

  it("should return empty when user has no sessions", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await listSessions({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.sessions).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should return only active sessions and exclude expired", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    // 7 active sessions
    for (let i = 0; i < 7; i++) {
      await insertSession(container, userId, {
        createdAt: new Date(now - i * 1000),
      });
    }
    // 3 expired sessions
    for (let i = 0; i < 3; i++) {
      await insertSession(container, userId, {
        createdAt: new Date(now - (i + 10) * 1000),
        expiresAt: new Date(now - 1000), // expired
      });
    }

    const result = await listSessions({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.totalCount).toBe(7);
  });

  it("should paginate with offset=0, limit=5", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    for (let i = 0; i < 7; i++) {
      await insertSession(container, userId, {
        createdAt: new Date(now - i * 1000),
      });
    }

    const result = await listSessions({
      container,
      headers: createMockHeaders(),
      input: { userId, offset: 0, limit: 5 },
    });

    expect(result.sessions).toHaveLength(5);
    expect(result.totalCount).toBe(7);
  });

  it("should paginate with offset=5, limit=5", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    for (let i = 0; i < 7; i++) {
      await insertSession(container, userId, {
        createdAt: new Date(now - i * 1000),
      });
    }

    const result = await listSessions({
      container,
      headers: createMockHeaders(),
      input: { userId, offset: 5, limit: 5 },
    });

    expect(result.sessions).toHaveLength(2);
    expect(result.totalCount).toBe(7);
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      listSessions({
        container,
        headers: createMockHeaders(),
        input: { userId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      listSessions({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when offset is negative", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      listSessions({
        container,
        headers: createMockHeaders(),
        input: { userId, offset: -1 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 0", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      listSessions({
        container,
        headers: createMockHeaders(),
        input: { userId, limit: 0 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 6", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      listSessions({
        container,
        headers: createMockHeaders(),
        input: { userId, limit: 6 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      listSessions({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should return 1 session with limit=1", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await insertSession(container, userId);
    await insertSession(container, userId);

    const result = await listSessions({
      container,
      headers: createMockHeaders(),
      input: { userId, offset: 0, limit: 1 },
    });

    expect(result.sessions).toHaveLength(1);
  });

  it("should use default offset=0, limit=5 when omitted", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    for (let i = 0; i < 7; i++) {
      await insertSession(container, userId, {
        createdAt: new Date(now - i * 1000),
      });
    }

    const result = await listSessions({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.sessions).toHaveLength(5);
    expect(result.totalCount).toBe(7);
  });

  it("should mark current session with isCurrent=true", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const currentSessionId = await insertSession(container, userId);
    await insertSession(container, userId);

    const result = await listSessions({
      container,
      headers: createMockHeaders(),
      input: { userId, currentSessionId },
    });

    const currentSession = result.sessions.find(
      (s) => s.sessionId === currentSessionId,
    );
    expect(currentSession?.isCurrent).toBe(true);

    const otherSessions = result.sessions.filter(
      (s) => s.sessionId !== currentSessionId,
    );
    for (const session of otherSessions) {
      expect(session.isCurrent).toBe(false);
    }
  });
});
