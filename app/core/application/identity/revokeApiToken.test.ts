import { describe, expect, it, vi } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { revokeApiToken } from "./revokeApiToken";

describe("revokeApiToken", () => {
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

  it("should revoke a valid token", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(
      container.authenticationProvider,
      "validateApiToken",
    ).mockResolvedValue({
      ok: true,
      value: {
        userId: userId as never,
        scopes: ["k:app_record:read" as never],
      },
    });

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { userId, token: "valid-token" },
      }),
    ).resolves.toBeUndefined();
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { userId: "", token: "some-token" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid", token: "some-token" },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when token is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { userId, token: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), token: "some-token" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw UnauthenticatedError when token does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(
      container.authenticationProvider,
      "validateApiToken",
    ).mockResolvedValue({
      ok: false,
      error: { kind: "InvalidToken" as const },
    });

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { userId, token: "nonexistent-token" },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it("should throw UnauthenticatedError when token is already revoked", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(
      container.authenticationProvider,
      "validateApiToken",
    ).mockResolvedValue({
      ok: false,
      error: { kind: "InvalidToken" as const },
    });

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { userId, token: "revoked-token" },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it("should throw UnauthenticatedError when token belongs to different user", async () => {
    const container = getContainer();
    const userA = await insertUser(container);
    const userB = await insertUser(container);

    vi.spyOn(
      container.authenticationProvider,
      "validateApiToken",
    ).mockResolvedValue({
      ok: true,
      value: { userId: userA as never, scopes: ["k:app_record:read" as never] },
    });

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { userId: userB, token: "user-a-token" },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });
});
