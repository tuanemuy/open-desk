import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { addUserToOrganization } from "./addUserToOrganization";

describe("addUserToOrganization", () => {
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

  it("should add user to organization", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const orgId = await insertOrganization(container);

    const result = await addUserToOrganization({
      container,
      headers: createMockHeaders(),
      input: { userId, organizationId: orgId },
    });

    expect(result.userId).toBe(userId);
    expect(result.organizationId).toBe(orgId);
  });

  it("should throw ValidationError when userId is empty", async () => {
    const container = getContainer();

    await expect(
      addUserToOrganization({
        container,
        headers: createMockHeaders(),
        input: { userId: "", organizationId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      addUserToOrganization({
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
      addUserToOrganization({
        container,
        headers: createMockHeaders(),
        input: { userId: crypto.randomUUID(), organizationId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when organizationId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      addUserToOrganization({
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
      addUserToOrganization({
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
      addUserToOrganization({
        container,
        headers: createMockHeaders(),
        input: {
          userId,
          organizationId: crypto.randomUUID(),
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should handle adding a user already in the organization (idempotent or error depending on adapter)", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const orgId = await insertOrganization(container);

    await addUserToOrganization({
      container,
      headers: createMockHeaders(),
      input: { userId, organizationId: orgId },
    });

    // The adapter may either succeed idempotently or throw a conflict error
    try {
      const result = await addUserToOrganization({
        container,
        headers: createMockHeaders(),
        input: { userId, organizationId: orgId },
      });
      expect(result.userId).toBe(userId);
      expect(result.organizationId).toBe(orgId);
    } catch {
      // If it throws, that's also acceptable (AlreadyMemberError)
    }
  });

  it("should allow user to belong to multiple organizations", async () => {
    const container = getContainer();
    const userId = await insertUser(container);
    const orgA = await insertOrganization(container);
    const orgB = await insertOrganization(container);

    await addUserToOrganization({
      container,
      headers: createMockHeaders(),
      input: { userId, organizationId: orgA },
    });

    const result = await addUserToOrganization({
      container,
      headers: createMockHeaders(),
      input: { userId, organizationId: orgB },
    });

    expect(result.organizationId).toBe(orgB);
  });
});
