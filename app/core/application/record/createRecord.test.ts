import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import type { FieldValue } from "@/core/domain/record/valueObject";
import { createRecord } from "./createRecord";

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

describe("createRecord", () => {
  it("should create a record with valid field values", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const fieldValues = new Map([
      ["text_field", { type: "SINGLE_LINE_TEXT" as const, value: "Hello" }],
    ]);
    const result = await createRecord({
      container,
      headers: headers(),
      input: { appId: "app-1", fieldValues, creatorId: "user-1" },
    });
    expect(result.recordId).toBeDefined();
    expect(result.revision).toBe(1);
  });

  it("should create a record with multiple field types", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const fieldValues = new Map<string, FieldValue>([
      ["text_field", { type: "SINGLE_LINE_TEXT" as const, value: "Hello" }],
      ["number_field", { type: "NUMBER" as const, value: "42" }],
    ]);
    const result = await createRecord({
      container,
      headers: headers(),
      input: { appId: "app-1", fieldValues, creatorId: "user-1" },
    });
    expect(result.recordId).toBeDefined();
  });

  it("should throw FieldValidationError when validation fails", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockRejectedValue(
      new BusinessRuleError(
        "RECORD_FIELD_VALIDATION",
        "Required field missing",
      ),
    );
    const fieldValues = new Map();
    await expect(
      createRecord({
        container,
        headers: headers(),
        input: { appId: "app-1", fieldValues, creatorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw when writing to a read-only field", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const fieldValues = new Map([
      ["status_field", { type: "STATUS" as const, value: "Active" }],
    ]);
    await expect(
      createRecord({
        container,
        headers: headers(),
        input: { appId: "app-1", fieldValues, creatorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
