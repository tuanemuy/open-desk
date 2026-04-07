import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError, ValidationError } from "../error";
import { bulkChangeStatus } from "./bulkChangeStatus";
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

describe("bulkChangeStatus", () => {
  it("should change status for multiple records", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r1 = await seedRecord(container);
    const r2 = await seedRecord(container);
    vi.spyOn(
      container.processExecutionService,
      "executeTransition",
    ).mockImplementation(async (record) => ({
      entity: {
        ...record,
        revision: record.revision + 2,
        status: "Closed",
      } as never,
      events: [],
    }));
    const result = await bulkChangeStatus({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        records: [
          { recordId: r1.recordId, revision: 1 },
          { recordId: r2.recordId, revision: 1 },
        ],
        action: "Close",
      },
    });
    expect(result.records).toHaveLength(2);
  });

  it("should throw ValidationError for 101+ records", async () => {
    const container = getContainer();
    const records = Array.from({ length: 101 }, (_, i) => ({
      recordId: `r-${i}`,
      revision: 1,
    }));
    await expect(
      bulkChangeStatus({
        container,
        headers: headers(),
        input: { appId: "app-1", records, action: "Close" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError for non-existent record", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      bulkChangeStatus({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          records: [{ recordId: "non-existent", revision: 1 }],
          action: "Close",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw RevisionConflictError for mismatched revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    await expect(
      bulkChangeStatus({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          records: [{ recordId: r.recordId, revision: 99 }],
          action: "Close",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
