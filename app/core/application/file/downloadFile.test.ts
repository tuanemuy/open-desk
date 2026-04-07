import { describe, expect, it, vi } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  NotFoundError,
  SystemError,
  ValidationError,
} from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { downloadFile } from "./downloadFile";

describe("downloadFile", () => {
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
      contentType: string;
    }> = {},
  ) {
    const fileKey = overrides.fileKey ?? crypto.randomUUID();
    await container.db.insert(schema.storedFiles).values({
      fileKey,
      fileName: "test.txt",
      contentType: overrides.contentType ?? "text/plain",
      size: 1024,
      uploaderId: userId,
      status: overrides.status ?? "ATTACHED",
      uploadedAt: new Date(),
      expiresAt: overrides.expiresAt ?? null,
    });
    return fileKey;
  }

  function createReadableStream(content = "test-data"): ReadableStream {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(content));
        controller.close();
      },
    });
  }

  it("should download PERMANENT (ATTACHED) file", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const fileKey = await insertStoredFile(container, userId, {
      status: "ATTACHED",
    });

    vi.spyOn(container.fileStorageProvider, "download").mockResolvedValue({
      data: createReadableStream(),
      metadata: {
        fileName: "test.txt",
        contentType: "text/plain",
        size: 1024,
      },
    });

    const result = await downloadFile({
      container,
      headers: createMockHeaders(),
      input: { fileKey },
    });

    expect(result.fileName).toBe("test.txt");
    expect(result.contentType).toBe("text/plain");
    expect(result.size).toBe(1024);
  });

  it("should download TEMPORARY file within expiration", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const fileKey = await insertStoredFile(container, userId, {
      status: "TEMPORARY",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    vi.spyOn(container.fileStorageProvider, "download").mockResolvedValue({
      data: createReadableStream(),
      metadata: {
        fileName: "test.txt",
        contentType: "text/plain",
        size: 1024,
      },
    });

    const result = await downloadFile({
      container,
      headers: createMockHeaders(),
      input: { fileKey },
    });

    expect(result.fileName).toBe("test.txt");
  });

  it("should throw NotFoundError when file does not exist", async () => {
    const container = getContainer();

    await expect(
      downloadFile({
        container,
        headers: createMockHeaders(),
        input: { fileKey: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when TEMPORARY file is expired", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const fileKey = await insertStoredFile(container, userId, {
      status: "TEMPORARY",
      expiresAt: new Date(Date.now() - 1000), // already expired
    });

    await expect(
      downloadFile({
        container,
        headers: createMockHeaders(),
        input: { fileKey },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw SystemError when storage download fails", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const fileKey = await insertStoredFile(container, userId, {
      status: "ATTACHED",
    });

    vi.spyOn(container.fileStorageProvider, "download").mockRejectedValue(
      new Error("Storage failure"),
    );

    await expect(
      downloadFile({
        container,
        headers: createMockHeaders(),
        input: { fileKey },
      }),
    ).rejects.toThrow(SystemError);
  });

  it("should return matching contentType for different file types", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const fileKey = await insertStoredFile(container, userId, {
      status: "ATTACHED",
      contentType: "image/png",
    });

    vi.spyOn(container.fileStorageProvider, "download").mockResolvedValue({
      data: createReadableStream(),
      metadata: {
        fileName: "image.png",
        contentType: "image/png",
        size: 2048,
      },
    });

    const result = await downloadFile({
      container,
      headers: createMockHeaders(),
      input: { fileKey },
    });

    expect(result.contentType).toBe("image/png");
  });

  it("should throw ValidationError when fileKey is empty", async () => {
    const container = getContainer();

    await expect(
      downloadFile({
        container,
        headers: createMockHeaders(),
        input: { fileKey: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
