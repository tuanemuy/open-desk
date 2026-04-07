import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { addField } from "./addField";
import { deleteField } from "./deleteField";

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
      properties: {},
      layoutPosition: null,
      creatorId: "user-1",
    },
  });
}

describe("deleteField", () => {
  it("should delete a user-created field", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const field = await seedField(container, "app-1", "field_a");
    const result = await deleteField({
      container,
      headers: headers(),
      input: { appId: "app-1", fieldId: field.fieldId, executorId: "user-1" },
    });
    expect(result.deletedFieldIds).toContain(field.fieldId);
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      deleteField({
        container,
        headers: headers(),
        input: { appId: "non-existent", fieldId: "f-1", executorId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent fieldId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      deleteField({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          fieldId: "non-existent",
          executorId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      deleteField({
        container,
        headers: headers(),
        input: { appId: "app-1", fieldId: "f-1", executorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
