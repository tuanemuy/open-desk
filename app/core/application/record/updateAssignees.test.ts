import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { createRecord } from "./createRecord";
import { updateAssignees } from "./updateAssignees";

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

describe("updateAssignees", () => {
  it("should update assignees", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    vi.spyOn(
      container.processExecutionService,
      "updateAssignees",
    ).mockImplementation(async (record, assignees) => ({
      entity: {
        ...record,
        statusAssignees: assignees,
        updatedAt: new Date(),
      } as never,
      events: [],
    }));
    const result = await updateAssignees({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        assignees: ["user-1"],
        revision: 1,
      },
    });
    expect(result.revision).toBeDefined();
  });

  it("should clear assignees with empty array", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    vi.spyOn(
      container.processExecutionService,
      "updateAssignees",
    ).mockImplementation(async (record, assignees) => ({
      entity: {
        ...record,
        statusAssignees: assignees,
        updatedAt: new Date(),
      } as never,
      events: [],
    }));
    const result = await updateAssignees({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId: r.recordId, assignees: [] },
    });
    expect(result.revision).toBeDefined();
  });

  it("should skip revision check with revision=-1", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    vi.spyOn(
      container.processExecutionService,
      "updateAssignees",
    ).mockImplementation(async (record, assignees) => ({
      entity: {
        ...record,
        statusAssignees: assignees,
        updatedAt: new Date(),
      } as never,
      events: [],
    }));
    const result = await updateAssignees({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        assignees: ["user-1"],
        revision: -1,
      },
    });
    expect(result.revision).toBeDefined();
  });

  it("should throw NotFoundError when record does not exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      updateAssignees({
        container,
        headers: headers(),
        input: { appId: "app-1", recordId: "non-existent", assignees: [] },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw RevisionConflictError for mismatched revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    await expect(
      updateAssignees({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: r.recordId,
          assignees: [],
          revision: 99,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
