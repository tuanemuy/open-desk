import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ForbiddenError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updateAnnouncement } from "./updateAnnouncement";

describe("updateAnnouncement", () => {
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

  async function grantSystemAdmin(
    container: ReturnType<typeof getContainer>,
    userId: string,
  ) {
    await container.db.insert(schema.systemPermissions).values({
      entityType: "USER",
      entityCode: userId,
      systemAdmin: true,
    });
  }

  async function insertAnnouncement(
    container: ReturnType<typeof getContainer>,
    userId: string,
  ) {
    const announcementId = crypto.randomUUID();
    await container.db.insert(schema.portalAnnouncements).values({
      id: announcementId,
      title: "Old Title",
      body: "<p>Old body</p>",
      attachmentFileKeys: JSON.stringify([]) as unknown as never,
      lastUpdatedBy: userId,
    });
    return announcementId;
  }

  it("should update announcement by system admin", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);
    await insertAnnouncement(container, userId);

    const result = await updateAnnouncement({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        title: "New Title",
        body: "<p>New body</p>",
        attachmentFileKeys: [],
      },
    });

    expect(result.title).toBe("New Title");
    expect(result.body).toBe("<p>New body</p>");
    expect(result.announcementId).toBeDefined();
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should create default announcement when none exists and then update", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);

    const result = await updateAnnouncement({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        title: "New Title",
        body: "<p>New body</p>",
        attachmentFileKeys: [],
      },
    });

    expect(result.title).toBe("New Title");
    expect(result.announcementId).toBeDefined();
  });

  it("should update with empty body and empty attachments", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);
    await insertAnnouncement(container, userId);

    const result = await updateAnnouncement({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        title: "Updated",
        body: "",
        attachmentFileKeys: [],
      },
    });

    expect(result.body).toBe("");
    expect(result.attachmentFileKeys).toHaveLength(0);
  });

  it("should throw ForbiddenError when operator is not admin", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    // No admin permission granted

    await expect(
      updateAnnouncement({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: userId,
          title: "New Title",
          body: "body",
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ValidationError when title is empty", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);

    await expect(
      updateAnnouncement({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: userId,
          title: "",
          body: "body",
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when operatorId is empty", async () => {
    const container = getContainer();

    await expect(
      updateAnnouncement({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: "",
          title: "Title",
          body: "body",
          attachmentFileKeys: [],
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should succeed with title of 1 character (minimum valid)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);

    const result = await updateAnnouncement({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        title: "A",
        body: "",
        attachmentFileKeys: [],
      },
    });

    expect(result.title).toBe("A");
  });

  it("should throw ValidationError when attachment exceeds 1GB", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);

    // Insert a stored file that is too large
    const fileKey = crypto.randomUUID();
    await container.db.insert(schema.storedFiles).values({
      fileKey,
      fileName: "big.bin",
      contentType: "application/octet-stream",
      size: 1_073_741_825, // 1GB + 1 byte
      uploaderId: userId,
      status: "TEMPORARY",
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await expect(
      updateAnnouncement({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: userId,
          title: "Title",
          body: "body",
          attachmentFileKeys: [fileKey],
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should succeed when attachment is exactly 1GB", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);

    const fileKey = crypto.randomUUID();
    await container.db.insert(schema.storedFiles).values({
      fileKey,
      fileName: "exact.bin",
      contentType: "application/octet-stream",
      size: 1_073_741_824, // exactly 1GB
      uploaderId: userId,
      status: "TEMPORARY",
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const result = await updateAnnouncement({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        title: "Title",
        body: "body",
        attachmentFileKeys: [fileKey],
      },
    });

    expect(result.title).toBe("Title");
  });

  it("should succeed with multiple valid attachments", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);

    const fileKeys: string[] = [];
    for (let i = 0; i < 3; i++) {
      const fileKey = crypto.randomUUID();
      await container.db.insert(schema.storedFiles).values({
        fileKey,
        fileName: `file${i}.txt`,
        contentType: "text/plain",
        size: 1024,
        uploaderId: userId,
        status: "TEMPORARY",
        uploadedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      fileKeys.push(fileKey);
    }

    const result = await updateAnnouncement({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        title: "Title",
        body: "body",
        attachmentFileKeys: fileKeys,
      },
    });

    expect(result.attachmentFileKeys).toHaveLength(3);
  });

  it("should throw ValidationError when one of multiple attachments exceeds 1GB", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);

    const smallFileKey = crypto.randomUUID();
    await container.db.insert(schema.storedFiles).values({
      fileKey: smallFileKey,
      fileName: "small.txt",
      contentType: "text/plain",
      size: 1024,
      uploaderId: userId,
      status: "TEMPORARY",
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const largeFileKey = crypto.randomUUID();
    await container.db.insert(schema.storedFiles).values({
      fileKey: largeFileKey,
      fileName: "big.bin",
      contentType: "application/octet-stream",
      size: 1_073_741_825,
      uploaderId: userId,
      status: "TEMPORARY",
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await expect(
      updateAnnouncement({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: userId,
          title: "Title",
          body: "body",
          attachmentFileKeys: [smallFileKey, largeFileKey],
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should clear attachments when changing to empty array", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await grantSystemAdmin(container, userId);

    // First create with attachment
    const fileKey = crypto.randomUUID();
    await container.db.insert(schema.storedFiles).values({
      fileKey,
      fileName: "file.txt",
      contentType: "text/plain",
      size: 1024,
      uploaderId: userId,
      status: "TEMPORARY",
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await updateAnnouncement({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        title: "With Attachment",
        body: "body",
        attachmentFileKeys: [fileKey],
      },
    });

    // Then update with empty attachments
    const result = await updateAnnouncement({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: userId,
        title: "No Attachment",
        body: "body",
        attachmentFileKeys: [],
      },
    });

    expect(result.attachmentFileKeys).toHaveLength(0);
  });
});
