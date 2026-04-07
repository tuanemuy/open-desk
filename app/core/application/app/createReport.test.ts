import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { FieldCode as FieldCodeVO } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { createReport } from "./createReport";

const getContainer = setupTestContainer();
const headers = () => createMockHeaders();

const fc = (code: string) => FieldCodeVO.create(code);

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

const baseInput = {
  appId: "app-1",
  reportName: "Report",
  chartType: "BAR" as const,
  chartSubType: null,
  groups: [{ fieldCode: fc("field_a"), timeUnit: null }],
  aggregations: [{ fieldCode: fc("field_b"), method: "COUNT" as const }],
  filterCondition: null,
  sort: null,
  creatorId: "user-1",
};

describe("createReport", () => {
  it("should create a BAR chart report", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await createReport({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.reportId).toBeDefined();
    expect(result.reportName).toBe("Report");
    expect(result.chartType).toBe("BAR");
  });

  it("should create a PIVOT_TABLE report", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await createReport({
      container,
      headers: headers(),
      input: {
        ...baseInput,
        chartType: "PIVOT_TABLE" as const,
        groups: [
          { fieldCode: fc("major"), timeUnit: null },
          { fieldCode: fc("minor"), timeUnit: null },
        ],
        aggregations: [{ fieldCode: fc("f"), method: "COUNT" as const }],
      },
    });
    expect(result.chartType).toBe("PIVOT_TABLE");
  });

  it("should create a report with filterCondition", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await createReport({
      container,
      headers: headers(),
      input: { ...baseInput, filterCondition: 'field_a = "test"' },
    });
    expect(result.reportId).toBeDefined();
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      createReport({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "bad" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      createReport({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for empty reportName", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      createReport({
        container,
        headers: headers(),
        input: { ...baseInput, reportName: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for 4+ groups", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      createReport({
        container,
        headers: headers(),
        input: {
          ...baseInput,
          groups: Array.from({ length: 4 }, (_, i) => ({
            fieldCode: fc(`f${i}`),
            timeUnit: null,
          })),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should accept exactly 3 groups (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await createReport({
      container,
      headers: headers(),
      input: {
        ...baseInput,
        groups: Array.from({ length: 3 }, (_, i) => ({
          fieldCode: fc(`f${i}`),
          timeUnit: null,
        })),
      },
    });
    expect(result.reportId).toBeDefined();
  });
});
