import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "@/core/application/error";
import { evaluateOrgAccess } from "./evaluateOrgAccess";

const getContainer = setupTestContainer();
const headers = () => createMockHeaders();

async function seedUser(
  db: ReturnType<typeof getContainer>["db"],
  id = "user-1",
) {
  await db.insert(schema.users).values({
    id,
    loginName: `login-${id}`,
    displayName: `User ${id}`,
    email: `${id}@test.com`,
    passwordHash: "hash",
  });
}

async function seedOrganization(
  db: ReturnType<typeof getContainer>["db"],
  id: string,
  code: string,
) {
  await db.insert(schema.organizations).values({
    id,
    name: `Org ${id}`,
    code,
  });
}

async function addUserToOrganization(
  db: ReturnType<typeof getContainer>["db"],
  userId: string,
  organizationId: string,
) {
  await db.insert(schema.userOrganizations).values({
    userId,
    organizationId,
  });
}

async function seedOrgAccessRule(
  db: ReturnType<typeof getContainer>["db"],
  sourceOrgId: string,
  targetOrgId: string,
  opts: { accessLevel?: string; isEnabled?: boolean } = {},
) {
  await db.insert(schema.orgAccessRules).values({
    sourceOrganizationId: sourceOrgId,
    targetOrganizationId: targetOrgId,
    accessLevel: opts.accessLevel ?? "FULL",
    isEnabled: opts.isEnabled ?? true,
  });
}

describe("evaluateOrgAccess", () => {
  it("should return FULL when user's org has FULL access rule", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-source", "org-code-source");
    await seedOrganization(container.db, "org-target", "org-code-target");
    await addUserToOrganization(container.db, "user-1", "org-source");
    await seedOrgAccessRule(container.db, "org-source", "org-target", {
      accessLevel: "FULL",
      isEnabled: true,
    });

    const result = await evaluateOrgAccess({
      container,
      headers: headers(),
      input: {
        targetUserId: "user-1",
        targetOrganizationId: "org-target",
      },
    });

    expect(result.accessLevel).toBe("FULL");
    expect(result.userId).toBe("user-1");
    expect(result.targetOrganizationId).toBe("org-target");
  });

  it("should return READ_ONLY when user's org has READ_ONLY access rule", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-source", "org-code-source");
    await seedOrganization(container.db, "org-target", "org-code-target");
    await addUserToOrganization(container.db, "user-1", "org-source");
    await seedOrgAccessRule(container.db, "org-source", "org-target", {
      accessLevel: "READ_ONLY",
      isEnabled: true,
    });

    const result = await evaluateOrgAccess({
      container,
      headers: headers(),
      input: {
        targetUserId: "user-1",
        targetOrganizationId: "org-target",
      },
    });

    expect(result.accessLevel).toBe("READ_ONLY");
  });

  it("should return NONE when user's org has NONE access rule", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-source", "org-code-source");
    await seedOrganization(container.db, "org-target", "org-code-target");
    await addUserToOrganization(container.db, "user-1", "org-source");
    await seedOrgAccessRule(container.db, "org-source", "org-target", {
      accessLevel: "NONE",
      isEnabled: true,
    });

    const result = await evaluateOrgAccess({
      container,
      headers: headers(),
      input: {
        targetUserId: "user-1",
        targetOrganizationId: "org-target",
      },
    });

    expect(result.accessLevel).toBe("NONE");
  });

  it("should return default NONE when no rule exists for user's org", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-source", "org-code-source");
    await seedOrganization(container.db, "org-target", "org-code-target");
    await addUserToOrganization(container.db, "user-1", "org-source");
    // No access rule seeded

    const result = await evaluateOrgAccess({
      container,
      headers: headers(),
      input: {
        targetUserId: "user-1",
        targetOrganizationId: "org-target",
      },
    });

    expect(result.accessLevel).toBe("NONE");
  });

  it("should ignore disabled rules and return default NONE", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-source", "org-code-source");
    await seedOrganization(container.db, "org-target", "org-code-target");
    await addUserToOrganization(container.db, "user-1", "org-source");
    await seedOrgAccessRule(container.db, "org-source", "org-target", {
      accessLevel: "FULL",
      isEnabled: false,
    });

    const result = await evaluateOrgAccess({
      container,
      headers: headers(),
      input: {
        targetUserId: "user-1",
        targetOrganizationId: "org-target",
      },
    });

    expect(result.accessLevel).toBe("NONE");
  });

  it("should return max access level when user belongs to multiple orgs", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-a", "org-code-a");
    await seedOrganization(container.db, "org-b", "org-code-b");
    await seedOrganization(container.db, "org-target", "org-code-target");
    await addUserToOrganization(container.db, "user-1", "org-a");
    await addUserToOrganization(container.db, "user-1", "org-b");
    await seedOrgAccessRule(container.db, "org-a", "org-target", {
      accessLevel: "READ_ONLY",
      isEnabled: true,
    });
    await seedOrgAccessRule(container.db, "org-b", "org-target", {
      accessLevel: "FULL",
      isEnabled: true,
    });

    const result = await evaluateOrgAccess({
      container,
      headers: headers(),
      input: {
        targetUserId: "user-1",
        targetOrganizationId: "org-target",
      },
    });

    expect(result.accessLevel).toBe("FULL");
  });

  it("should return default NONE when user belongs to no organizations", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-target", "org-code-target");
    // User not added to any org

    const result = await evaluateOrgAccess({
      container,
      headers: headers(),
      input: {
        targetUserId: "user-1",
        targetOrganizationId: "org-target",
      },
    });

    expect(result.accessLevel).toBe("NONE");
  });

  it("should throw NotFoundError for non-existent user", async () => {
    const container = getContainer();

    await expect(
      evaluateOrgAccess({
        container,
        headers: headers(),
        input: {
          targetUserId: "non-existent-user",
          targetOrganizationId: "org-target",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
