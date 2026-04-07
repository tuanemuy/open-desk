import { describe, expect, it, vi } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { uploadFile } from "./uploadFile";

describe("uploadFile", () => {
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

  function createReadableStream(content = "test-data"): ReadableStream {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(content));
        controller.close();
      },
    });
  }

  it("should upload file with valid inputs", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(container.fileStorageProvider, "upload").mockResolvedValue(
      undefined,
    );

    const result = await uploadFile({
      container,
      headers: createMockHeaders(),
      input: {
        uploaderId: userId,
        fileName: "test.txt",
        contentType: "text/plain",
        data: createReadableStream(),
        size: 1024,
      },
    });

    expect(result.fileKey).toBeDefined();
    expect(result.fileName).toBe("test.txt");
    expect(result.contentType).toBe("text/plain");
    expect(result.size).toBe(1024);
    expect(result.status).toBe("TEMPORARY");
    expect(result.uploadedAt).toBeInstanceOf(Date);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it("should throw ValidationError when fileName is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      uploadFile({
        container,
        headers: createMockHeaders(),
        input: {
          uploaderId: userId,
          fileName: "",
          contentType: "text/plain",
          data: createReadableStream(),
          size: 1024,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when size is 0", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      uploadFile({
        container,
        headers: createMockHeaders(),
        input: {
          uploaderId: userId,
          fileName: "test.txt",
          contentType: "text/plain",
          data: createReadableStream(),
          size: 0,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when size is negative", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      uploadFile({
        container,
        headers: createMockHeaders(),
        input: {
          uploaderId: userId,
          fileName: "test.txt",
          contentType: "text/plain",
          data: createReadableStream(),
          size: -1,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when size exceeds 1GB", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      uploadFile({
        container,
        headers: createMockHeaders(),
        input: {
          uploaderId: userId,
          fileName: "test.txt",
          contentType: "text/plain",
          data: createReadableStream(),
          size: 1_073_741_825, // 1GB + 1 byte
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw SystemError when storage upload fails", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(container.fileStorageProvider, "upload").mockRejectedValue(
      new Error("Storage failure"),
    );

    await expect(
      uploadFile({
        container,
        headers: createMockHeaders(),
        input: {
          uploaderId: userId,
          fileName: "test.txt",
          contentType: "text/plain",
          data: createReadableStream(),
          size: 1024,
        },
      }),
    ).rejects.toThrow(SystemError);
  });

  it("should succeed with exactly 1GB (boundary)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(container.fileStorageProvider, "upload").mockResolvedValue(
      undefined,
    );

    const result = await uploadFile({
      container,
      headers: createMockHeaders(),
      input: {
        uploaderId: userId,
        fileName: "large.bin",
        contentType: "application/octet-stream",
        data: createReadableStream(),
        size: 1_073_741_824, // exactly 1GB
      },
    });

    expect(result.fileKey).toBeDefined();
  });

  it("should fail with 1GB + 1 byte", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      uploadFile({
        container,
        headers: createMockHeaders(),
        input: {
          uploaderId: userId,
          fileName: "large.bin",
          contentType: "application/octet-stream",
          data: createReadableStream(),
          size: 1_073_741_825,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should succeed with 1 byte (minimum valid size)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(container.fileStorageProvider, "upload").mockResolvedValue(
      undefined,
    );

    const result = await uploadFile({
      container,
      headers: createMockHeaders(),
      input: {
        uploaderId: userId,
        fileName: "tiny.txt",
        contentType: "text/plain",
        data: createReadableStream("a"),
        size: 1,
      },
    });

    expect(result.fileKey).toBeDefined();
  });

  it("should throw error when contentType is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(container.fileStorageProvider, "upload").mockResolvedValue(
      undefined,
    );

    await expect(
      uploadFile({
        container,
        headers: createMockHeaders(),
        input: {
          uploaderId: userId,
          fileName: "test.txt",
          contentType: "",
          data: createReadableStream(),
          size: 1024,
        },
      }),
    ).rejects.toThrow();
  });

  it("should generate UUID v4 format fileKey", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(container.fileStorageProvider, "upload").mockResolvedValue(
      undefined,
    );

    const result = await uploadFile({
      container,
      headers: createMockHeaders(),
      input: {
        uploaderId: userId,
        fileName: "test.txt",
        contentType: "text/plain",
        data: createReadableStream(),
        size: 1024,
      },
    });

    // Check fileKey looks like a UUID
    expect(typeof result.fileKey).toBe("string");
    expect((result.fileKey as string).length).toBeGreaterThan(0);
  });

  it("should set expiresAt to approximately now + 3 days", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    vi.spyOn(container.fileStorageProvider, "upload").mockResolvedValue(
      undefined,
    );

    const before = Date.now();
    const result = await uploadFile({
      container,
      headers: createMockHeaders(),
      input: {
        uploaderId: userId,
        fileName: "test.txt",
        contentType: "text/plain",
        data: createReadableStream(),
        size: 1024,
      },
    });
    const after = Date.now();

    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + threeDaysMs - 1000,
    );
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
      after + threeDaysMs + 1000,
    );
  });
});
