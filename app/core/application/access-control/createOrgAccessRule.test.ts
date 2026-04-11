import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ForbiddenError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createOrgAccessRule } from "./createOrgAccessRule";

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

async function seedCybozuAdmin(
  db: ReturnType<typeof getContainer>["db"],
  entityCode: string,
) {
  await db.insert(schema.systemPermissions).values({
    entityType: "USER",
    entityCode,
    systemAdmin: true,
  });
}

describe("createOrgAccessRule", () => {
  it("should throw ForbiddenError when operator is not cybozu admin", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-1", "org-code-1");
    await seedOrganization(container.db, "org-2", "org-code-2");

    await expect(
      createOrgAccessRule({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          sourceOrganizationId: "org-1",
          targetOrganizationId: "org-2",
          accessLevel: "FULL",
          isEnabled: true,
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should create org access rule when operator is cybozu admin", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedCybozuAdmin(container.db, "login-user-1");
    await seedOrganization(container.db, "org-1", "org-code-1");
    await seedOrganization(container.db, "org-2", "org-code-2");

    const result = await createOrgAccessRule({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        sourceOrganizationId: "org-1",
        targetOrganizationId: "org-2",
        accessLevel: "FULL",
        isEnabled: true,
      },
    });

    expect(result.sourceOrganizationId).toBe("org-1");
    expect(result.targetOrganizationId).toBe("org-2");
    expect(result.accessLevel).toBe("FULL");
    expect(result.isEnabled).toBe(true);
  });

  it("should throw BusinessRuleError when source and target are the same organization", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedCybozuAdmin(container.db, "login-user-1");
    await seedOrganization(container.db, "org-1", "org-code-1");

    await expect(
      createOrgAccessRule({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          sourceOrganizationId: "org-1",
          targetOrganizationId: "org-1",
          accessLevel: "FULL",
          isEnabled: true,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw ForbiddenError for non-admin even with valid organizations", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-a", "org-code-a");
    await seedOrganization(container.db, "org-b", "org-code-b");

    await expect(
      createOrgAccessRule({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          sourceOrganizationId: "org-a",
          targetOrganizationId: "org-b",
          accessLevel: "READ_ONLY",
          isEnabled: true,
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ForbiddenError for NONE access level without admin", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-a", "org-code-a");
    await seedOrganization(container.db, "org-b", "org-code-b");

    await expect(
      createOrgAccessRule({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          sourceOrganizationId: "org-a",
          targetOrganizationId: "org-b",
          accessLevel: "NONE",
          isEnabled: true,
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ForbiddenError when creating disabled rule without admin", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedOrganization(container.db, "org-a", "org-code-a");
    await seedOrganization(container.db, "org-b", "org-code-b");

    await expect(
      createOrgAccessRule({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          sourceOrganizationId: "org-a",
          targetOrganizationId: "org-b",
          accessLevel: "FULL",
          isEnabled: false,
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
