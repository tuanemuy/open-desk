import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updateUserProfile } from "./updateUserProfile";

describe("updateUserProfile", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function createUser(container: ReturnType<typeof getContainer>) {
    const userId = crypto.randomUUID();
    const hashed = await hasher.hash("password123");

    await container.db.insert(schema.users).values({
      id: userId,
      loginName: "test@example.com",
      displayName: "Test User",
      email: "test@example.com",
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
      timezone: "Asia/Tokyo",
      language: "ja",
    });

    return userId;
  }

  it("should update all profile fields", async () => {
    const container = getContainer();
    const userId = await createUser(container);

    const result = await updateUserProfile({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        displayName: "Updated Name",
        timezone: "America/New_York",
        language: "en",
        timeFormat: "12h",
      },
    });

    expect(result.userId).toBe(userId);
    expect(result.displayName).toBe("Updated Name");
    expect(result.timezone).toBe("America/New_York");
    expect(result.language).toBe("en");
    expect(result.timeFormat).toBe("12h");
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should update displayName only", async () => {
    const container = getContainer();
    const userId = await createUser(container);

    const result = await updateUserProfile({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        displayName: "Only Name Changed",
        timezone: "Asia/Tokyo",
        language: "ja",
        timeFormat: "24h",
      },
    });

    expect(result.displayName).toBe("Only Name Changed");
    expect(result.timezone).toBe("Asia/Tokyo");
    expect(result.language).toBe("ja");
    expect(result.timeFormat).toBe("24h");
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      updateUserProfile({
        container,
        headers: createMockHeaders(),
        input: {
          userId: "",
          displayName: "Test",
          timezone: "Asia/Tokyo",
          language: "ja",
          timeFormat: "24h",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      updateUserProfile({
        container,
        headers: createMockHeaders(),
        input: {
          userId: "not-uuid",
          displayName: "Test",
          timezone: "Asia/Tokyo",
          language: "ja",
          timeFormat: "24h",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw BusinessRuleError when displayName is empty", async () => {
    const container = getContainer();
    const userId = await createUser(container);

    await expect(
      updateUserProfile({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          displayName: "",
          timezone: "Asia/Tokyo",
          language: "ja",
          timeFormat: "24h",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when timezone is invalid", async () => {
    const container = getContainer();
    const userId = await createUser(container);

    await expect(
      updateUserProfile({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          displayName: "Test",
          timezone: "Invalid/Zone",
          language: "ja",
          timeFormat: "24h",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when language is unsupported", async () => {
    const container = getContainer();
    const userId = await createUser(container);

    await expect(
      updateUserProfile({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          displayName: "Test",
          timezone: "Asia/Tokyo",
          language: "de",
          timeFormat: "24h",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      updateUserProfile({
        container,
        headers: createMockHeaders(),
        input: {
          userId: crypto.randomUUID(),
          displayName: "Test",
          timezone: "Asia/Tokyo",
          language: "ja",
          timeFormat: "24h",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should update timezone to UTC", async () => {
    const container = getContainer();
    const userId = await createUser(container);

    const result = await updateUserProfile({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        displayName: "Test User",
        timezone: "UTC",
        language: "ja",
        timeFormat: "24h",
      },
    });

    expect(result.timezone).toBe("UTC");
  });

  it("should update language to en", async () => {
    const container = getContainer();
    const userId = await createUser(container);

    const result = await updateUserProfile({
      container,
      headers: createMockHeaders(),
      input: {
        userId,
        displayName: "Test User",
        timezone: "Asia/Tokyo",
        language: "en",
        timeFormat: "24h",
      },
    });

    expect(result.language).toBe("en");
  });
});
