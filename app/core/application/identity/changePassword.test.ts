import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { changePassword } from "./changePassword";

describe("changePassword", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertUser(container: ReturnType<typeof getContainer>) {
    const userId = crypto.randomUUID();
    const hashed = await hasher.hash("currentpass123");

    await container.db.insert(schema.users).values({
      id: userId,
      loginName: "test@example.com",
      displayName: "Test User",
      email: "test@example.com",
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });

    return userId;
  }

  it("should change password with valid current password and new password", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          currentPassword: "currentpass123",
          newPassword: "newpassword456",
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId: "",
          currentPassword: "currentpass123",
          newPassword: "newpassword456",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId: "not-uuid",
          currentPassword: "currentpass123",
          newPassword: "newpassword456",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when currentPassword is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          currentPassword: "",
          newPassword: "newpassword456",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when newPassword is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          currentPassword: "currentpass123",
          newPassword: "",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId: crypto.randomUUID(),
          currentPassword: "currentpass123",
          newPassword: "newpassword456",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw UnauthenticatedError when current password is wrong", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          currentPassword: "wrongpassword",
          newPassword: "newpassword456",
        },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it("should throw BusinessRuleError when new password is too short (7 chars)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          currentPassword: "currentpass123",
          newPassword: "short12",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed when new password is exactly 8 characters", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          currentPassword: "currentpass123",
          newPassword: "exactly8",
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("should throw BusinessRuleError when new password same as loginName", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      changePassword({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          currentPassword: "currentpass123",
          newPassword: "test@example.com",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
