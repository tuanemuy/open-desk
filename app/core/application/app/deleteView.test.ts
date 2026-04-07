import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { addField } from "./addField";
import { createView } from "./createView";
import { deleteView } from "./deleteView";

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

describe("deleteView", () => {
  it("should delete a user-created view", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await addField({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        fieldCode: "f_a",
        label: "F",
        fieldType: "SINGLE_LINE_TEXT",
        required: null,
        unique: null,
        noLabel: null,
        defaultValue: null,
        properties: {},
        layoutPosition: null,
        creatorId: "user-1",
      },
    });
    const view = await createView({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        viewName: "My View",
        viewType: "LIST",
        fields: ["f_a"],
        calendarDateField: null,
        calendarTitleField: null,
        html: null,
        pager: null,
        deviceScope: null,
        filterCondition: null,
        sort: null,
        creatorId: "user-1",
      },
    });
    const result = await deleteView({
      container,
      headers: headers(),
      input: { appId: "app-1", viewId: view.viewId, executorId: "user-1" },
    });
    expect(result.viewId).toBe(view.viewId);
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      deleteView({
        container,
        headers: headers(),
        input: { appId: "non-existent", viewId: "v-1", executorId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent viewId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      deleteView({
        container,
        headers: headers(),
        input: { appId: "app-1", viewId: "non-existent", executorId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      deleteView({
        container,
        headers: headers(),
        input: { appId: "app-1", viewId: "v-1", executorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
