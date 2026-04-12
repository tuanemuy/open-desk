import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { issueApiToken } from "./issueApiToken";

describe("issueApiToken", () => {
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

  it("should issue token with a single valid scope", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await issueApiToken({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        scopes: ["k:app_record:read"],
        summary: "Test token",
      },
    });

    expect(result.token).toBeDefined();
    expect(result.token.length).toBeGreaterThan(0);
    expect(result.scopes).toEqual(["k:app_record:read"]);
    expect(result.id).toBeDefined();
    expect(result.summary).toBe("Test token");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.expiresAt).toBeNull();
  });

  it("should issue token with multiple valid scopes", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await issueApiToken({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        scopes: ["k:app_record:read", "k:app_record:write", "k:file:read"],
        summary: "Multi-scope token",
      },
    });

    expect(result.token).toBeDefined();
    expect(result.scopes).toHaveLength(3);
  });

  it("should persist the token record in the database", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await issueApiToken({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        scopes: ["k:app_record:read"],
        summary: "Persisted token",
      },
    });

    const records = await container.db
      .select()
      .from(schema.apiTokenRecords)
      .limit(10);

    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(result.id);
    expect(records[0].summary).toBe("Persisted token");
    expect(records[0].userId).toBe(userId);
    expect(records[0].tokenHash).toBeDefined();
    expect(records[0].tokenHash.length).toBeGreaterThan(0);
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      issueApiToken({
        container,
        headers: createMockHeaders(),
        input: {
          userId: "",
          scopes: ["k:app_record:read"],
          summary: "Test",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      issueApiToken({
        container,
        headers: createMockHeaders(),
        input: {
          userId: "not-uuid",
          scopes: ["k:app_record:read"],
          summary: "Test",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when scopes is empty array", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      issueApiToken({
        container,
        headers: createMockHeaders(),
        input: { userId, scopes: [], summary: "Test" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when scopes contains invalid value", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      issueApiToken({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          scopes: ["invalid_scope"],
          summary: "Test",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when summary is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      issueApiToken({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          scopes: ["k:app_record:read"],
          summary: "",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      issueApiToken({
        container,
        headers: createMockHeaders(),
        input: {
          userId: crypto.randomUUID(),
          scopes: ["k:app_record:read"],
          summary: "Test",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should issue token with all valid scopes", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const allScopes = [
      "k:app_record:read",
      "k:app_record:write",
      "k:app_settings:read",
      "k:app_settings:write",
      "k:file:read",
      "k:file:write",
    ];

    const result = await issueApiToken({
      container,
      headers: createMockHeaders(),
      input: { userId, scopes: allScopes, summary: "All scopes" },
    });

    expect(result.token).toBeDefined();
    expect(result.scopes).toHaveLength(6);
  });
});
