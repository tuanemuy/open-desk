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

async function seedField(
  container: ReturnType<typeof getContainer>,
  appId: string,
  code: string,
  type = "SINGLE_LINE_TEXT" as const,
) {
  return addField({
    container,
    headers: headers(),
    input: {
      appId,
      fieldCode: code,
      label: `Label ${code}`,
      fieldType: type,
      required: null,
      unique: null,
      noLabel: null,
      defaultValue: null,
      properties: {
        type: "SINGLE_LINE_TEXT" as const,
        expression: null,
        hideExpression: false,
        minLength: null,
        maxLength: null,
      },
      layoutPosition: null,
      creatorId: "user-1",
    },
  });
}

describe("createView", () => {
  it("should create a LIST view", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await seedField(container, "app-1", "field_a");
    const result = await createView({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        viewName: "My View",
        viewType: "LIST",
        fields: ["field_a"],
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
    expect(result.viewId).toBeDefined();
    expect(result.viewName).toBe("My View");
    expect(result.viewType).toBe("LIST");
  });

  it("should create a CUSTOM view", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await createView({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        viewName: "Custom View",
        viewType: "CUSTOM",
        fields: null,
        calendarDateField: null,
        calendarTitleField: null,
        html: "<div>custom</div>",
        pager: true,
        deviceScope: "PC_AND_MOBILE",
        filterCondition: null,
        sort: null,
        creatorId: "user-1",
      },
    });
    expect(result.viewType).toBe("CUSTOM");
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      createView({
        container,
        headers: headers(),
        input: {
          appId: "non-existent",
          viewName: "V",
          viewType: "LIST",
          fields: ["f"],
          calendarDateField: null,
          calendarTitleField: null,
          html: null,
          pager: null,
          deviceScope: null,
          filterCondition: null,
          sort: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      createView({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          viewName: "V",
          viewType: "LIST",
          fields: ["f"],
          calendarDateField: null,
          calendarTitleField: null,
          html: null,
          pager: null,
          deviceScope: null,
          filterCondition: null,
          sort: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for duplicate viewName", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await seedField(container, "app-1", "field_a");
    await createView({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        viewName: "Dup View",
        viewType: "LIST",
        fields: ["field_a"],
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
      createView({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          viewName: "Dup View",
          viewType: "LIST",
          fields: ["field_a"],
          calendarDateField: null,
          calendarTitleField: null,
          html: null,
          pager: null,
          deviceScope: null,
          filterCondition: null,
          sort: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
