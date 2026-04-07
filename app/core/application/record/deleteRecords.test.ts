import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError, ValidationError } from "../error";
import { createRecord } from "./createRecord";
import { deleteRecords } from "./deleteRecords";

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

describe("deleteRecords", () => {
  it("should delete a single record", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    await deleteRecords({
      container,
      headers: headers(),
      input: { appId: "app-1", recordIds: [r.recordId] },
    });
  });

  it("should delete with correct revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    await deleteRecords({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordIds: [r.recordId],
        revisions: new Map([[r.recordId, 1]]),
      },
    });
  });

  it("should skip revision check when revisions omitted", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    await deleteRecords({
      container,
      headers: headers(),
      input: { appId: "app-1", recordIds: [r.recordId] },
    });
  });

  it("should throw ValidationError for 101+ records", async () => {
    const container = getContainer();
    const ids = Array.from({ length: 101 }, (_, i) => `r-${i}`);
    await expect(
      deleteRecords({
        container,
        headers: headers(),
        input: { appId: "app-1", recordIds: ids },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw RevisionConflictError for mismatched revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    await expect(
      deleteRecords({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordIds: [r.recordId],
          revisions: new Map([[r.recordId, 99]]),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError for non-existent record", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      deleteRecords({
        container,
        headers: headers(),
        input: { appId: "app-1", recordIds: ["non-existent"] },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
