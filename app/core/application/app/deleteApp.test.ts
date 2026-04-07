import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { deleteApp } from "./deleteApp";

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

describe("deleteApp", () => {
  it("should delete an ACTIVE app and change status to DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE" });
    const result = await deleteApp({
      container,
      headers: headers(),
      input: { appId: "app-1", executorId: "user-1" },
    });
    expect(result.status).toBe("DELETED");
    expect(result.appId).toBe("app-1");
    expect(result.deletedAt).toBeInstanceOf(Date);
  });

  it("should delete a PREVIEW app and change status to DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-2", status: "PREVIEW" });
    const result = await deleteApp({
      container,
      headers: headers(),
      input: { appId: "app-2", executorId: "user-1" },
    });
    expect(result.status).toBe("DELETED");
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      deleteApp({
        container,
        headers: headers(),
        input: { appId: "non-existent", executorId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when deleting an already DELETED app", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-3", status: "DELETED" });
    await expect(
      deleteApp({
        container,
        headers: headers(),
        input: { appId: "app-3", executorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should perform logical deletion (recoverable)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-4", status: "ACTIVE" });
    const result = await deleteApp({
      container,
      headers: headers(),
      input: { appId: "app-4", executorId: "user-1" },
    });
    expect(result.status).toBe("DELETED");
    // The app still exists in the DB (soft delete)
    const apps = await container.db.select().from(schema.apps);
    expect(apps.length).toBe(1);
    expect(apps[0].status).toBe("DELETED");
  });
});
