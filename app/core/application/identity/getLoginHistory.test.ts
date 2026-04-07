import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { getLoginHistory } from "./getLoginHistory";

describe("getLoginHistory", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  const DAY_MS = 24 * 60 * 60 * 1000;

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
      createdAt: Date;
      expiresAt: Date;
      userAgent: string;
      ipAddress: string;
    }> = {},
  ) {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    await container.db.insert(schema.sessions).values({
      id: sessionId,
      userId,
      ipAddress: overrides.ipAddress ?? "192.168.1.1",
      userAgent: overrides.userAgent ?? "TestBrowser/1.0",
      createdAt: overrides.createdAt ?? now,
      expiresAt:
        overrides.expiresAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000),
    });
    return sessionId;
  }

  it("should return login history within past 2 weeks", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    await insertSession(container, userId, {
      createdAt: new Date(now - DAY_MS),
    });
    await insertSession(container, userId, {
      createdAt: new Date(now - 2 * DAY_MS),
    });

    const result = await getLoginHistory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.loginHistories.length).toBe(2);
    // Verify descending order by loginAt
    expect(result.loginHistories[0].loginAt.getTime()).toBeGreaterThanOrEqual(
      result.loginHistories[1].loginAt.getTime(),
    );
  });

  it("should return empty when no login history in past 2 weeks", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await getLoginHistory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.loginHistories).toHaveLength(0);
  });

  it("should exclude sessions created more than 15 days ago", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    await insertSession(container, userId, {
      createdAt: new Date(now - 15 * DAY_MS),
    });

    const result = await getLoginHistory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.loginHistories).toHaveLength(0);
  });

  it("should include sessions created exactly 14 days ago (boundary)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    // Slightly less than 14 days to be within boundary
    await insertSession(container, userId, {
      createdAt: new Date(now - 14 * DAY_MS + 1000),
    });

    const result = await getLoginHistory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.loginHistories.length).toBeGreaterThanOrEqual(1);
  });

  it("should limit to 10 entries per userAgent group", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    for (let i = 0; i < 15; i++) {
      await insertSession(container, userId, {
        createdAt: new Date(now - i * 60 * 1000),
        userAgent: "SameAgent/1.0",
      });
    }

    const result = await getLoginHistory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.loginHistories.length).toBe(10);
  });

  it("should merge entries from different userAgents", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    const agents = ["AgentA/1.0", "AgentB/1.0", "AgentC/1.0"];

    for (let a = 0; a < agents.length; a++) {
      for (let i = 0; i < 5; i++) {
        await insertSession(container, userId, {
          createdAt: new Date(now - (a * 5 + i) * 60 * 1000),
          userAgent: agents[a],
        });
      }
    }

    const result = await getLoginHistory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.loginHistories.length).toBe(15);
    // Should be sorted descending
    for (let i = 0; i < result.loginHistories.length - 1; i++) {
      expect(result.loginHistories[i].loginAt.getTime()).toBeGreaterThanOrEqual(
        result.loginHistories[i + 1].loginAt.getTime(),
      );
    }
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      getLoginHistory({
        container,
        headers: createMockHeaders(),
        input: { userId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      getLoginHistory({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      getLoginHistory({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should include both expired and active sessions within past 2 weeks", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const now = Date.now();
    // Active session
    await insertSession(container, userId, {
      createdAt: new Date(now - DAY_MS),
      expiresAt: new Date(now + DAY_MS),
    });
    // Expired session (but created within 2 weeks)
    await insertSession(container, userId, {
      createdAt: new Date(now - 2 * DAY_MS),
      expiresAt: new Date(now - DAY_MS), // expired
    });

    const result = await getLoginHistory({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.loginHistories.length).toBe(2);
  });
});
