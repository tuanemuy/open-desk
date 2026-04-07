import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError, ValidationError } from "../error";
import { bulkUpdateRecords } from "./bulkUpdateRecords";
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

describe("bulkUpdateRecords", () => {
  it("should update a single record", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const result = await bulkUpdateRecords({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        records: [
          {
            recordId: r.recordId,
            fieldValues: new Map([
              ["f", { type: "SINGLE_LINE_TEXT", value: "updated" }],
            ]),
            revision: 1,
          },
        ],
        modifierId: "user-1",
      },
    });
    expect(result.records).toHaveLength(1);
    expect(result.records[0].revision).toBe(2);
  });

  it("should throw ValidationError for 101 records", async () => {
    const container = getContainer();
    const records = Array.from({ length: 101 }, (_, i) => ({
      recordId: `r-${i}`,
      fieldValues: new Map(),
      revision: 1,
    }));
    await expect(
      bulkUpdateRecords({
        container,
        headers: headers(),
        input: { appId: "app-1", records, modifierId: "user-1" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should return empty result for 0 records", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const result = await bulkUpdateRecords({
      container,
      headers: headers(),
      input: { appId: "app-1", records: [], modifierId: "user-1" },
    });
    expect(result.records).toHaveLength(0);
  });

  it("should throw RevisionConflictError for mismatched revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    await expect(
      bulkUpdateRecords({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          records: [
            {
              recordId: r.recordId,
              fieldValues: new Map([
                ["f", { type: "SINGLE_LINE_TEXT", value: "v" }],
              ]),
              revision: 99,
            },
          ],
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError for non-existent record", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    await expect(
      bulkUpdateRecords({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          records: [
            { recordId: "non-existent", fieldValues: new Map(), revision: 1 },
          ],
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
