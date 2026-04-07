import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { getPortalView } from "./getPortalView";

describe("getPortalView", () => {
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

  async function insertAnnouncement(
    container: ReturnType<typeof getContainer>,
    userId: string,
    overrides: Partial<{
      title: string;
      body: string;
    }> = {},
  ) {
    const announcementId = crypto.randomUUID();
    await container.db.insert(schema.portalAnnouncements).values({
      id: announcementId,
      title: overrides.title ?? "Test Announcement",
      body: overrides.body ?? "<p>Test body</p>",
      attachmentFileKeys: JSON.stringify([]) as unknown as never,
      lastUpdatedBy: userId,
    });
    return announcementId;
  }

  it("should return portal view with announcement", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    await insertAnnouncement(container, userId);

    const result = await getPortalView({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId },
    });

    expect(result.announcement).not.toBeNull();
    expect(result.announcement?.title).toBe("Test Announcement");
    expect(result.announcement?.body).toBe("<p>Test body</p>");
  });

  it("should return null announcement when none exists", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await getPortalView({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId },
    });

    expect(result.announcement).toBeNull();
  });

  it("should return empty widgets data when no notifications/spaces/apps exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await getPortalView({
      container,
      headers: createMockHeaders(),
      input: { operatorId: userId },
    });

    // Portal view should still return without error
    expect(result).toBeDefined();
  });
});
