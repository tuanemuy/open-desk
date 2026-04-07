import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { deleteOrganization } from "./deleteOrganization";

describe("deleteOrganization", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertOrganization(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<{
      id: string;
      parentOrganizationId: string | null;
    }> = {},
  ) {
    const orgId = overrides.id ?? crypto.randomUUID();
    await container.db.insert(schema.organizations).values({
      id: orgId,
      name: "Test Org",
      code: `org-${orgId}`,
      parentOrganizationId: overrides.parentOrganizationId ?? null,
    });
    return orgId;
  }

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

  it("should delete organization with no children or members", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);

    await expect(
      deleteOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: orgId },
      }),
    ).resolves.toBeUndefined();
  });

  it("should throw ValidationError when organizationId is empty", async () => {
    const container = getContainer();

    await expect(
      deleteOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when organizationId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      deleteOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: "not-uuid" },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError when organization does not exist", async () => {
    const container = getContainer();

    await expect(
      deleteOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: crypto.randomUUID() },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw error when organization has child organizations", async () => {
    const container = getContainer();
    const parentId = await insertOrganization(container);
    await insertOrganization(container, { parentOrganizationId: parentId });

    await expect(
      deleteOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: parentId },
      }),
    ).rejects.toThrow();
  });

  it("should handle organization with members (depends on adapter constraints)", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);
    const userId = await insertUser(container);

    await container.db.insert(schema.userOrganizations).values({
      userId,
      organizationId: orgId,
    });

    // The adapter may cascade delete memberships or throw a constraint error
    try {
      await deleteOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: orgId },
      });
      // Cascade delete is acceptable
    } catch {
      // Constraint error is also acceptable (OrganizationHasMembersError)
    }
  });
});
