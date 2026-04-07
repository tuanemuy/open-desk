import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { configureAction } from "./configureAction";

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
    name: "App",
    status: "ACTIVE",
    revision: 1,
    creatorId: "user-1",
    modifierId: "user-1",
    ...overrides,
  });
}

const baseInput = {
  appId: "app-1",
  actionId: null as string | null,
  actionName: "Copy Action",
  destinationAppId: "app-2",
  fieldMappings: [],
  allowedEntities: [],
  filterCondition: null,
  index: null,
  executorId: "user-1",
};

describe("configureAction", () => {
  it("should create a new action", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await seedApp(container.db, { id: "app-2" });
    const result = await configureAction({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.actionId).toBeDefined();
    expect(result.actionName).toBe("Copy Action");
  });

  it("should update an existing action name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await seedApp(container.db, { id: "app-2" });
    const created = await configureAction({
      container,
      headers: headers(),
      input: baseInput,
    });
    const result = await configureAction({
      container,
      headers: headers(),
      input: {
        ...baseInput,
        actionId: created.actionId,
        actionName: "Updated Action",
      },
    });
    expect(result.actionName).toBe("Updated Action");
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      configureAction({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "bad" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await seedApp(container.db, { id: "app-2" });
    await expect(
      configureAction({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError for non-existent destinationAppId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      configureAction({
        container,
        headers: headers(),
        input: { ...baseInput, destinationAppId: "bad" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError for empty actionName", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await seedApp(container.db, { id: "app-2" });
    await expect(
      configureAction({
        container,
        headers: headers(),
        input: { ...baseInput, actionName: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError for non-existent actionId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await seedApp(container.db, { id: "app-2" });
    await expect(
      configureAction({
        container,
        headers: headers(),
        input: { ...baseInput, actionId: "bad" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
