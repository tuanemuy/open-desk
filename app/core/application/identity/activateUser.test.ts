import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { activateUser } from "./activateUser";

describe("activateUser", () => {
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
      isActive: overrides.isActive ?? false,
    });

    return userId;
  }

  it("should activate an inactive user", async () => {
    const container = getContainer();
    const userId = await insertUser(container, { isActive: false });

    const result = await activateUser({
      container,
      headers: createMockHeaders(),
      input: { userId },
    });

    expect(result.userId).toBe(userId);
    expect(result.isActive).toBe(true);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      activateUser({
        container,
        headers: createMockHeaders(),
        input: { userId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      activateUser({
        container,
        headers: createMockHeaders(),
        input: { userId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      activateUser({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when user is already active", async () => {
    const container = getContainer();
    const userId = await insertUser(container, { isActive: true });

    await expect(
      activateUser({
        container,
        headers: createMockHeaders(),
        input: { userId },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
