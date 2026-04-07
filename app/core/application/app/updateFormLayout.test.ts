import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { addField } from "./addField";
import { updateFormLayout } from "./updateFormLayout";

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

describe("updateFormLayout", () => {
  it("should update layout with all fields", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const field = await addField({
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
    const result = await updateFormLayout({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        rows: [
          {
            type: "ROW",
            code: null,
            fields: [{ code: "f_a", size: "NORMAL" }],
            innerLayout: null,
          },
        ],
        modifierId: "user-1",
      },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      updateFormLayout({
        container,
        headers: headers(),
        input: { appId: "bad", rows: [], modifierId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      updateFormLayout({
        container,
        headers: headers(),
        input: { appId: "app-1", rows: [], modifierId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
