import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { createReport } from "./createReport";
import { enablePeriodicReport } from "./enablePeriodicReport";

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
async function seedReport(container: ReturnType<typeof getContainer>) {
  return createReport({
    container,
    headers: headers(),
    input: {
      appId: "app-1",
      reportName: "R1",
      chartType: "BAR",
      chartSubType: null,
      groups: [{ fieldCode: "f", sortDirection: "ASC" }],
      aggregations: [{ fieldCode: "f", method: "COUNT" }],
      filterCondition: null,
      sort: null,
      creatorId: "user-1",
    },
  });
}

const basePeriodicInput = {
  interval: "DAILY" as const,
  dayOfMonth: null,
  dayOfWeek: null,
  quarterMonth: null,
  hourMinute: { hour: 9, minute: 0 },
  minuteOfHour: null,
  timezone: "Asia/Tokyo",
  executorId: "user-1",
};

describe("enablePeriodicReport", () => {
  it("should enable a daily periodic report", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const report = await seedReport(container);
    const result = await enablePeriodicReport({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        reportId: report.reportId,
        ...basePeriodicInput,
      },
    });
    expect(result.isSettingsLocked).toBe(true);
  });

  it("should enable a monthly periodic report", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const report = await seedReport(container);
    const result = await enablePeriodicReport({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        reportId: report.reportId,
        ...basePeriodicInput,
        interval: "MONTHLY",
        dayOfMonth: 15,
      },
    });
    expect(result.isSettingsLocked).toBe(true);
  });

  it("should enable a weekly periodic report", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const report = await seedReport(container);
    const result = await enablePeriodicReport({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        reportId: report.reportId,
        ...basePeriodicInput,
        interval: "WEEKLY",
        dayOfWeek: 1,
      },
    });
    expect(result.isSettingsLocked).toBe(true);
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      enablePeriodicReport({
        container,
        headers: headers(),
        input: { appId: "bad", reportId: "r", ...basePeriodicInput },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent reportId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      enablePeriodicReport({
        container,
        headers: headers(),
        input: { appId: "app-1", reportId: "bad", ...basePeriodicInput },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      enablePeriodicReport({
        container,
        headers: headers(),
        input: { appId: "app-1", reportId: "r", ...basePeriodicInput },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when periodic report already enabled", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const report = await seedReport(container);
    await enablePeriodicReport({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        reportId: report.reportId,
        ...basePeriodicInput,
      },
    });
    await expect(
      enablePeriodicReport({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          reportId: report.reportId,
          ...basePeriodicInput,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
