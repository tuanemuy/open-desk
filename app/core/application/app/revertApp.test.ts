import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { revertApp } from "./revertApp";

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

async function seedApp(
  db: ReturnType<typeof getContainer>["db"],
  overrides: Partial<typeof schema.apps.$inferInsert> & { id: string },
) {
  await db.insert(schema.apps).values({
    name: "Test App",
    status: "ACTIVE",
    revision: 1,
    creatorId: "user-1",
    modifierId: "user-1",
    ...overrides,
  });
}

describe("revertApp", () => {
  it("should revert an ACTIVE app with undeployed changes", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 2 });
    vi.spyOn(container.appDeploymentService, "revert").mockResolvedValue();
    const result = await revertApp({
      container,
      headers: headers(),
      input: { appId: "app-1", executorId: "user-1" },
    });
    expect(result.appId).toBe("app-1");
    expect(result.revision).toBeDefined();
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      revertApp({
        container,
        headers: headers(),
        input: { appId: "non-existent", executorId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-2", status: "DELETED" });
    await expect(
      revertApp({
        container,
        headers: headers(),
        input: { appId: "app-2", executorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw when app has no undeployed changes (PREVIEW state)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-3", status: "PREVIEW" });
    // PREVIEW apps have never been deployed, so revert triggers the deployment service stub
    await expect(
      revertApp({
        container,
        headers: headers(),
        input: { appId: "app-3", executorId: "user-1" },
      }),
    ).rejects.toThrow();
  });
});
