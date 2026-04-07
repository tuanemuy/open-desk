import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { changeStatus } from "./changeStatus";
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

describe("changeStatus", () => {
  it("should change status with correct revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    vi.spyOn(
      container.processExecutionService,
      "executeTransition",
    ).mockResolvedValue({
      entity: {
        recordId: r.recordId,
        appId: "app-1",
        revision: 3,
        fieldValues: new Map(),
        status: "Closed",
        statusAssignees: [],
        creatorId: "user-1",
        createdAt: new Date(),
        modifierId: "user-1",
        updatedAt: new Date(),
      } as never,
      events: [],
    });
    const result = await changeStatus({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        action: "Close",
        revision: 1,
      },
    });
    expect(result.revision).toBe(3);
  });

  it("should skip revision check with revision=-1", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    vi.spyOn(
      container.processExecutionService,
      "executeTransition",
    ).mockResolvedValue({
      entity: {
        recordId: r.recordId,
        appId: "app-1",
        revision: 3,
        fieldValues: new Map(),
        status: "Closed",
        statusAssignees: [],
        creatorId: "user-1",
        createdAt: new Date(),
        modifierId: "user-1",
        updatedAt: new Date(),
      } as never,
      events: [],
    });
    const result = await changeStatus({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        action: "Close",
        revision: -1,
      },
    });
    expect(result.revision).toBeDefined();
  });

  it("should skip revision check when revision is omitted", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    vi.spyOn(
      container.processExecutionService,
      "executeTransition",
    ).mockResolvedValue({
      entity: {
        recordId: r.recordId,
        appId: "app-1",
        revision: 3,
        fieldValues: new Map(),
        status: "Closed",
        statusAssignees: [],
        creatorId: "user-1",
        createdAt: new Date(),
        modifierId: "user-1",
        updatedAt: new Date(),
      } as never,
      events: [],
    });
    const result = await changeStatus({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId: r.recordId, action: "Close" },
    });
    expect(result.revision).toBeDefined();
  });

  it("should throw RecordNotFoundError when record does not exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      changeStatus({
        container,
        headers: headers(),
        input: { appId: "app-1", recordId: "non-existent", action: "Close" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw RevisionConflictError for mismatched revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    await expect(
      changeStatus({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: r.recordId,
          action: "Close",
          revision: 99,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
