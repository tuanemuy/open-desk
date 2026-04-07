import { describe, expect, it, vi } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { SystemError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { cleanupExpiredFiles } from "./cleanupExpiredFiles";

describe("cleanupExpiredFiles", () => {
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

  async function insertStoredFile(
    container: ReturnType<typeof getContainer>,
    userId: string,
    overrides: Partial<{
      fileKey: string;
      status: string;
      expiresAt: Date | null;
    }> = {},
  ) {
    const fileKey = overrides.fileKey ?? crypto.randomUUID();
    await container.db.insert(schema.storedFiles).values({
      fileKey,
      fileName: "test.txt",
      contentType: "text/plain",
      size: 1024,
      uploaderId: userId,
      status: overrides.status ?? "TEMPORARY",
      uploadedAt: new Date(),
      expiresAt: overrides.expiresAt ?? null,
    });
    return fileKey;
  }

  it("should delete expired TEMPORARY files", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const now = new Date();

    // Create expired temporary files
    await insertStoredFile(container, userId, {
      status: "TEMPORARY",
      expiresAt: new Date(now.getTime() - 1000),
    });
    await insertStoredFile(container, userId, {
      status: "TEMPORARY",
      expiresAt: new Date(now.getTime() - 2000),
    });

    vi.spyOn(container.fileStorageProvider, "deleteBatch").mockResolvedValue(2);

    const result = await cleanupExpiredFiles({
      container,
      headers: createMockHeaders(),
      input: { now },
    });

    expect(result.deletedCount).toBe(2);
  });

  it("should return deletedCount 0 when no expired files", async () => {
    const container = getContainer();
    const now = new Date();

    const result = await cleanupExpiredFiles({
      container,
      headers: createMockHeaders(),
      input: { now },
    });

    expect(result.deletedCount).toBe(0);
  });

  it("should only delete expired TEMPORARY files, not ATTACHED or non-expired TEMPORARY", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const now = new Date();

    // Expired TEMPORARY
    await insertStoredFile(container, userId, {
      status: "TEMPORARY",
      expiresAt: new Date(now.getTime() - 1000),
    });

    // Non-expired TEMPORARY
    await insertStoredFile(container, userId, {
      status: "TEMPORARY",
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    });

    // ATTACHED file (no expiration)
    await insertStoredFile(container, userId, {
      status: "ATTACHED",
      expiresAt: null,
    });

    vi.spyOn(container.fileStorageProvider, "deleteBatch").mockResolvedValue(1);

    const result = await cleanupExpiredFiles({
      container,
      headers: createMockHeaders(),
      input: { now },
    });

    expect(result.deletedCount).toBe(1);
  });

  it("should throw SystemError when storage deleteBatch fails", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const now = new Date();

    await insertStoredFile(container, userId, {
      status: "TEMPORARY",
      expiresAt: new Date(now.getTime() - 1000),
    });

    vi.spyOn(container.fileStorageProvider, "deleteBatch").mockRejectedValue(
      new Error("Storage failure"),
    );

    await expect(
      cleanupExpiredFiles({
        container,
        headers: createMockHeaders(),
        input: { now },
      }),
    ).rejects.toThrow(SystemError);
  });

  it("should handle many expired files", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const now = new Date();

    for (let i = 0; i < 10; i++) {
      await insertStoredFile(container, userId, {
        status: "TEMPORARY",
        expiresAt: new Date(now.getTime() - (i + 1) * 1000),
      });
    }

    vi.spyOn(container.fileStorageProvider, "deleteBatch").mockResolvedValue(
      10,
    );

    const result = await cleanupExpiredFiles({
      container,
      headers: createMockHeaders(),
      input: { now },
    });

    expect(result.deletedCount).toBe(10);
  });
});
