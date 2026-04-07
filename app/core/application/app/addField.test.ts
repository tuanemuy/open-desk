import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError, ValidationError } from "../error";
import { addField } from "./addField";

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

const baseInput = {
  appId: "app-1",
  fieldCode: "text_field",
  label: "Text Field",
  fieldType: "SINGLE_LINE_TEXT" as const,
  required: null,
  unique: null,
  noLabel: null,
  defaultValue: null,
  properties: {},
  layoutPosition: null,
  creatorId: "user-1",
};

describe("addField", () => {
  it("should add a field to an ACTIVE app", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await addField({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.fieldId).toBeDefined();
    expect(result.fieldCode).toBe("text_field");
    expect(result.label).toBe("Text Field");
    expect(result.fieldType).toBe("SINGLE_LINE_TEXT");
  });

  it("should add a required field", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await addField({
      container,
      headers: headers(),
      input: { ...baseInput, fieldCode: "req_field", required: true },
    });
    expect(result.fieldId).toBeDefined();
  });

  it("should add a unique field", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await addField({
      container,
      headers: headers(),
      input: { ...baseInput, fieldCode: "uniq_field", unique: true },
    });
    expect(result.fieldId).toBeDefined();
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      addField({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      addField({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for duplicate fieldCode", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await addField({ container, headers: headers(), input: baseInput });
    await expect(
      addField({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw ValidationError for system field type", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      addField({
        container,
        headers: headers(),
        input: {
          ...baseInput,
          fieldCode: "sys_field",
          fieldType: "RECORD_NUMBER" as never,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw BusinessRuleError for empty fieldCode", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      addField({
        container,
        headers: headers(),
        input: { ...baseInput, fieldCode: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
