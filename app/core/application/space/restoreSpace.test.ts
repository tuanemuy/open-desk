import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/application/error";
import { restoreSpace } from "./restoreSpace";

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

async function seedSystemPermission(
  db: ReturnType<typeof getContainer>["db"],
  entityCode: string,
  opts: { systemAdmin?: boolean } = {},
) {
  await db.insert(schema.systemPermissions).values({
    entityType: "USER",
    entityCode,
    systemAdmin: opts.systemAdmin ?? true,
  });
}

async function seedSpace(
  db: ReturnType<typeof getContainer>["db"],
  id = "space-1",
  creatorId = "user-1",
  overrides: { updatedAt?: Date } = {},
) {
  await db.insert(schema.spaces).values({
    id,
    name: `Space ${id}`,
    creatorId,
    updatedAt: overrides.updatedAt ?? new Date(),
  });
}

describe("restoreSpace", () => {
  it("should restore a space deleted 1 day ago", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");

    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    await seedSpace(container.db, "space-1", "user-1", {
      updatedAt: oneDayAgo,
    });

    const result = await restoreSpace({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        spaceId: "space-1",
      },
    });

    expect(result.spaceId).toBe("space-1");
    expect(result.name).toBeDefined();
    expect(result.isPrivate).toBeDefined();
    expect(result.useMultiThread).toBeDefined();
    expect(result.fixedMember).toBeDefined();
    expect(result.appCreationPermission).toBeDefined();
    expect(result.coverImage).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should restore a space deleted 13 days ago (within boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");

    const thirteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    await seedSpace(container.db, "space-1", "user-1", {
      updatedAt: thirteenDaysAgo,
    });

    const result = await restoreSpace({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        spaceId: "space-1",
      },
    });

    expect(result.spaceId).toBe("space-1");
  });

  it("should throw ForbiddenError when operator lacks system admin permission", async () => {
    const container = getContainer();
    await seedUser(container.db);
    // No system permission

    await seedSpace(container.db, "space-1", "user-1");

    await expect(
      restoreSpace({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          spaceId: "space-1",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError for non-existent space", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");

    await expect(
      restoreSpace({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          spaceId: "non-existent-space",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ValidationError when space restore has expired (30 days)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await seedSpace(container.db, "space-1", "user-1", {
      updatedAt: thirtyDaysAgo,
    });

    await expect(
      restoreSpace({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          spaceId: "space-1",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when space restore has just expired (14 days + 1 second)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");

    const justOverExpired = new Date(
      Date.now() - (14 * 24 * 60 * 60 * 1000 + 1000),
    );
    await seedSpace(container.db, "space-1", "user-1", {
      updatedAt: justOverExpired,
    });

    await expect(
      restoreSpace({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          spaceId: "space-1",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
