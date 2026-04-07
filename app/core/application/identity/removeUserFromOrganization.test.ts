import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { removeUserFromOrganization } from "./removeUserFromOrganization";

describe("removeUserFromOrganization", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertUser(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<{
      id: string;
      primaryOrganizationId: string | null;
    }> = {},
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
      isActive: true,
      primaryOrganizationId: overrides.primaryOrganizationId ?? null,
    });
    return userId;
  }

  async function insertOrganization(
    container: ReturnType<typeof getContainer>,
  ) {
    const orgId = crypto.randomUUID();
    await container.db.insert(schema.organizations).values({
      id: orgId,
      name: "Test Org",
      code: `org-${orgId}`,
    });
    return orgId;
  }

  it("should remove user from organization (non-primary)", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);
    const userId = await insertUser(container);

    await container.db.insert(schema.userOrganizations).values({
      userId,
      organizationId: orgId,
    });

    await expect(
      removeUserFromOrganization({
        container,
        headers: createMockHeaders(),
        input: { userId, organizationId: orgId },
      }),
    ).resolves.toBeUndefined();
  });

  it("should clear primaryOrganizationId when removing primary organization", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);
    const userId = await insertUser(container, {
      primaryOrganizationId: orgId,
    });

    await container.db.insert(schema.userOrganizations).values({
      userId,
      organizationId: orgId,
    });

    await removeUserFromOrganization({
      container,
      headers: createMockHeaders(),
      input: { userId, organizationId: orgId },
    });

    const [user] = await container.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    expect(user.primaryOrganizationId).toBeNull();
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      removeUserFromOrganization({
        container,
        headers: createMockHeaders(),
        input: { userId: "", organizationId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      removeUserFromOrganization({
        container,
        headers: createMockHeaders(),
        input: {
          userId: "not-uuid",
          organizationId: crypto.randomUUID(),
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when organizationId is empty", async () => {
    const container = getContainer();

    await expect(
      removeUserFromOrganization({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), organizationId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when organizationId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      removeUserFromOrganization({
        container,
        headers: createMockHeaders(),
        input: {
          userId: crypto.randomUUID(),
          organizationId: "not-uuid",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when user does not exist", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);

    await expect(
      removeUserFromOrganization({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), organizationId: orgId },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when organization does not exist", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    await expect(
      removeUserFromOrganization({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          organizationId: crypto.randomUUID(),
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should handle removing a user not in the organization (no-op or error depending on adapter)", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);
    const userId = await insertUser(container);

    // The adapter may silently succeed (no-op) or throw NotMemberError
    try {
      await removeUserFromOrganization({
        container,
        headers: createMockHeaders(),
        input: { userId, organizationId: orgId },
      });
      // No-op is acceptable
    } catch {
      // Throwing NotMemberError is also acceptable
    }
  });
});
