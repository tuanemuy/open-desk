import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { ValidationError } from "../error";
import { bulkCreateRecords } from "./bulkCreateRecords";

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

describe("bulkCreateRecords", () => {
  it("should create 1 record", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const result = await bulkCreateRecords({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        records: [
          {
            fieldValues: new Map([
              ["f", { type: "SINGLE_LINE_TEXT" as const, value: "v" }],
            ]),
          },
        ],
        creatorId: "user-1",
      },
    });
    expect(result.ids).toHaveLength(1);
    expect(result.revisions[0]).toBe(1);
  });

  it("should create 100 records (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(
      container.recordValidationService,
      "validateFieldValues",
    ).mockResolvedValue();
    const records = Array.from({ length: 100 }, () => ({
      fieldValues: new Map([
        ["f", { type: "SINGLE_LINE_TEXT" as const, value: "v" }],
      ]),
    }));
    const result = await bulkCreateRecords({
      container,
      headers: headers(),
      input: { appId: "app-1", records, creatorId: "user-1" },
    });
    expect(result.ids).toHaveLength(100);
  });

  it("should throw ValidationError for 101 records", async () => {
    const container = getContainer();
    const records = Array.from({ length: 101 }, () => ({
      fieldValues: new Map(),
    }));
    await expect(
      bulkCreateRecords({
        container,
        headers: headers(),
        input: { appId: "app-1", records, creatorId: "user-1" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should return empty result for 0 records", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await bulkCreateRecords({
      container,
      headers: headers(),
      input: { appId: "app-1", records: [], creatorId: "user-1" },
    });
    expect(result.ids).toHaveLength(0);
    expect(result.revisions).toHaveLength(0);
  });

  it("should rollback all when validation fails on any record", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(container.recordValidationService, "validateFieldValues")
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(
        new BusinessRuleError("RECORD_FIELD_VALIDATION", "Invalid"),
      );
    const records = [
      {
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT" as const, value: "v" }],
        ]),
      },
      {
        fieldValues: new Map([
          ["f", { type: "SINGLE_LINE_TEXT" as const, value: "bad" }],
        ]),
      },
    ];
    await expect(
      bulkCreateRecords({
        container,
        headers: headers(),
        input: { appId: "app-1", records, creatorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
