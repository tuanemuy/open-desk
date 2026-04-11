import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { issueApiToken } from "./issueApiToken";
import { revokeApiToken } from "./revokeApiToken";

describe("revokeApiToken", () => {
  const getContainer = setupTestContainer();
  const passwordHasher = new ScryptPasswordHasher();

  async function insertUser(container: ReturnType<typeof getContainer>) {
    const userId = crypto.randomUUID();
    const hashed = await passwordHasher.hash("password123");

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

  async function issueToken(
    container: ReturnType<typeof getContainer>,
    userId: string,
  ) {
    return issueApiToken({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        scopes: ["k:app_record:read"],
        summary: "Test token for revoke",
      },
    });
  }

  it("should revoke a valid token record", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const issued = await issueToken(container, userId);

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { tokenId: issued.id },
      }),
    ).resolves.toBeUndefined();

    const records = await container.db
      .select()
      .from(schema.apiTokenRecords)
      .limit(10);

    expect(records).toHaveLength(1);
    expect(records[0].revokedAt).not.toBeNull();
  });

  it("should throw ValidationError when tokenId is empty", async () => {
    const container = getContainer();

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { tokenId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError when token record does not exist", async () => {
    const container = getContainer();

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { tokenId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when token is already revoked", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const issued = await issueToken(container, userId);

    await revokeApiToken({
      container,
      headers: createMockHeaders(),
      input: { tokenId: issued.id },
    });

    await expect(
      revokeApiToken({
        container,
        headers: createMockHeaders(),
        input: { tokenId: issued.id },
      }),
    ).rejects.toThrow();
  });
});
