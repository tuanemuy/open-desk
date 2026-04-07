import { v7 as uuidv7 } from "uuid";
import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { NotFoundError, ValidationError } from "../error";
import { setCoverImage } from "./setCoverImage";

describe("setCoverImage", () => {
  const getContainer = setupTestContainer();

  const insertUser = async (
    db: ReturnType<typeof getContainer>["db"],
    overrides: Partial<typeof schema.users.$inferInsert> = {},
  ) => {
    const userId = overrides.id ?? uuidv7();
    await db.insert(schema.users).values({
      id: userId,
      loginName: `user-${userId}`,
      displayName: "Test User",
      email: `${userId}@example.com`,
      passwordHash: "hashed",
      isActive: true,
      ...overrides,
    });
    return userId;
  };

  const insertProfile = async (
    db: ReturnType<typeof getContainer>["db"],
    userId: string,
    overrides: Partial<typeof schema.profiles.$inferInsert> = {},
  ) => {
    await db.insert(schema.profiles).values({
      id: uuidv7(),
      userId,
      coverImageFileKey: null,
      comment: "",
      ...overrides,
    });
  };

  const insertStoredFile = async (
    db: ReturnType<typeof getContainer>["db"],
    uploaderId: string,
    overrides: Partial<typeof schema.storedFiles.$inferInsert> = {},
  ) => {
    const fileKey = overrides.fileKey ?? `file-${uuidv7()}`;
    await db.insert(schema.storedFiles).values({
      id: uuidv7(),
      fileKey,
      fileName: "image.jpg",
      contentType: "image/jpeg",
      size: overrides.size ?? 1024,
      uploaderId,
      status: "CONFIRMED",
      ...overrides,
    });
    return fileKey;
  };

  it("should set cover image when profile exists and no cover image is set", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId);
    const fileKey = await insertStoredFile(container.db, userId, {
      size: 1024,
    });

    const result = await setCoverImage({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, fileKey },
    });

    expect(result.userId).toBe(userId);
    expect(result.coverImageFileKey).toBe(fileKey);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should replace cover image when one already exists", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId, {
      coverImageFileKey: "old-cover.jpg",
    });
    const newFileKey = await insertStoredFile(container.db, userId, {
      size: 2048,
    });

    const result = await setCoverImage({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, fileKey: newFileKey },
    });

    expect(result.coverImageFileKey).toBe(newFileKey);
  });

  it("should throw NotFoundError when profile does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    const fileKey = await insertStoredFile(container.db, userId);

    await expect(
      setCoverImage({
        container,
        headers: createMockHeaders(),
        input: { operatorId: userId, fileKey },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ValidationError when file exceeds 5MB", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId);
    const fileKey = await insertStoredFile(container.db, userId, {
      size: 5 * 1024 * 1024 + 1, // 5MB + 1 byte
    });

    await expect(
      setCoverImage({
        container,
        headers: createMockHeaders(),
        input: { operatorId: userId, fileKey },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError when file does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId);

    await expect(
      setCoverImage({
        container,
        headers: createMockHeaders(),
        input: { operatorId: userId, fileKey: "nonexistent-file-key" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should succeed with exactly 5MB file (5,242,880 bytes)", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId);
    const fileKey = await insertStoredFile(container.db, userId, {
      size: 5 * 1024 * 1024, // exactly 5MB
    });

    const result = await setCoverImage({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, fileKey },
    });

    expect(result.coverImageFileKey).toBe(fileKey);
  });

  it("should throw ValidationError with 5MB + 1 byte file (5,242,881 bytes)", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId);
    const fileKey = await insertStoredFile(container.db, userId, {
      size: 5 * 1024 * 1024 + 1,
    });

    await expect(
      setCoverImage({
        container,
        headers: createMockHeaders(),
        input: { operatorId: userId, fileKey },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should succeed with 1 byte file (minimum valid size)", async () => {
    const container = getContainer();
    const userId = await insertUser(container.db);
    await insertProfile(container.db, userId);
    const fileKey = await insertStoredFile(container.db, userId, {
      size: 1,
    });

    const result = await setCoverImage({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId, fileKey },
    });

    expect(result.coverImageFileKey).toBe(fileKey);
  });
});
