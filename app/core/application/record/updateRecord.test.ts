import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { createRecord } from "./createRecord";
import { updateRecord } from "./updateRecord";

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
async function seedRecord(
  container: ReturnType<typeof getContainer>,
  appId = "app-1",
) {
  vi.spyOn(
    container.recordValidationService,
    "validateFieldValues",
  ).mockResolvedValue();
  return createRecord({
    container,
    headers: headers(),
    input: {
      appId,
      fieldValues: new Map([["f", { type: "SINGLE_LINE_TEXT", value: "v" }]]),
      creatorId: "user-1",
    },
  });
}

describe("updateRecord", () => {
  it("should update a record with correct revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await seedRecord(container);
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const result = await updateRecord({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: created.recordId,
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT", value: "updated" }],
        ]),
        revision: 1,
        modifierId: "user-1",
      },
    });
    expect(result.revision).toBe(2);
  });

  it("should skip revision check with revision=-1", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await seedRecord(container);
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const result = await updateRecord({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: created.recordId,
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT", value: "updated" }],
        ]),
        revision: -1,
        modifierId: "user-1",
      },
    });
    expect(result.revision).toBe(2);
  });

  it("should skip revision check when revision is omitted", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await seedRecord(container);
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const result = await updateRecord({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: created.recordId,
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT", value: "updated" }],
        ]),
        modifierId: "user-1",
      },
    });
    expect(result.revision).toBe(2);
  });

  it("should throw RevisionConflictError for mismatched revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await seedRecord(container);
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    await updateRecord({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: created.recordId,
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT", value: "v2" }],
        ]),
        revision: -1,
        modifierId: "user-1",
      },
    });
    await expect(
      updateRecord({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: created.recordId,
          fieldValues: new Map([
            ["f", { type: "SINGLE_LINE_TEXT", value: "v3" }],
          ]),
          revision: 1,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw RecordNotFoundError when record does not exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    await expect(
      updateRecord({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: "non-existent",
          fieldValues: new Map(),
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw when writing to read-only field", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await seedRecord(container);
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    await expect(
      updateRecord({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: created.recordId,
          fieldValues: new Map([["s", { type: "STATUS", value: "Active" }]]),
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw FieldValidationError on validation failure", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await seedRecord(container);
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockRejectedValue(
      new BusinessRuleError("RECORD_FIELD_VALIDATION", "Invalid"),
    );
    await expect(
      updateRecord({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: "any",
          fieldValues: new Map(),
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
