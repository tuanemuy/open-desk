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
import { updateView } from "./updateView";

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

describe("updateView", () => {
  it("should update view name", async () => {
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
        viewName: "V1",
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
    const result = await updateView({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        viewId: view.viewId,
        viewName: "V2",
        fields: null,
        calendarDateField: null,
        calendarTitleField: null,
        html: null,
        pager: null,
        deviceScope: null,
        filterCondition: undefined,
        sort: null,
        index: null,
        modifierId: "user-1",
      },
    });
    expect(result.viewName).toBe("V2");
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      updateView({
        container,
        headers: headers(),
        input: {
          appId: "bad",
          viewId: "v-1",
          viewName: "V",
          fields: null,
          calendarDateField: null,
          calendarTitleField: null,
          html: null,
          pager: null,
          deviceScope: null,
          filterCondition: undefined,
          sort: null,
          index: null,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent viewId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      updateView({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          viewId: "bad",
          viewName: "V",
          fields: null,
          calendarDateField: null,
          calendarTitleField: null,
          html: null,
          pager: null,
          deviceScope: null,
          filterCondition: undefined,
          sort: null,
          index: null,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      updateView({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          viewId: "v-1",
          viewName: "V",
          fields: null,
          calendarDateField: null,
          calendarTitleField: null,
          html: null,
          pager: null,
          deviceScope: null,
          filterCondition: undefined,
          sort: null,
          index: null,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for duplicate viewName", async () => {
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
    const view1 = await createView({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        viewName: "V1",
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
    await createView({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        viewName: "V2",
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
    await expect(
      updateView({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          viewId: view1.viewId,
          viewName: "V2",
          fields: null,
          calendarDateField: null,
          calendarTitleField: null,
          html: null,
          pager: null,
          deviceScope: null,
          filterCondition: undefined,
          sort: null,
          index: null,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
