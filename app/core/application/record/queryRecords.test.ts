import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { createRecord } from "./createRecord";
import { queryRecords } from "./queryRecords";

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

describe("queryRecords", () => {
  it("should return records without query (all records)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    await createRecord({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT" as const, value: "v1" }],
        ]),
        creatorId: "user-1",
      },
    });
    await createRecord({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT" as const, value: "v2" }],
        ]),
        creatorId: "user-1",
      },
    });
    const result = await queryRecords({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        executionContext: {
          loginUserId: "user-1",
          loginUserCode: "login-user-1",
          primaryOrganizationCode: null,
          now: new Date(),
        },
      },
    });
    expect(result.records.length).toBeGreaterThanOrEqual(2);
  });

  it("should return records with query", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    vi.spyOn(container.recordQueryService, "parseAndValidate").mockReturnValue({
      condition: null,
      orderBy: [],
      limit: null,
      offset: null,
    });
    vi.spyOn(container.recordQueryService, "resolveFunctions").mockReturnValue({
      condition: null,
      orderBy: [],
      limit: null,
      offset: null,
    });
    await createRecord({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT" as const, value: "v1" }],
        ]),
        creatorId: "user-1",
      },
    });
    const result = await queryRecords({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        query: 'f = "v1"',
        executionContext: {
          loginUserId: "user-1",
          loginUserCode: "login-user-1",
          primaryOrganizationCode: null,
          now: new Date(),
        },
      },
    });
    expect(result.records).toBeDefined();
  });

  it("should return empty records when no records exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await queryRecords({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        executionContext: {
          loginUserId: "user-1",
          loginUserCode: "login-user-1",
          primaryOrganizationCode: null,
          now: new Date(),
        },
      },
    });
    expect(result.records).toHaveLength(0);
  });

  it("should return totalCount when requested", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    await createRecord({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT" as const, value: "v" }],
        ]),
        creatorId: "user-1",
      },
    });
    const result = await queryRecords({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        totalCount: true,
        executionContext: {
          loginUserId: "user-1",
          loginUserCode: "login-user-1",
          primaryOrganizationCode: null,
          now: new Date(),
        },
      },
    });
    expect(result.totalCount).toBeGreaterThanOrEqual(1);
  });
});
