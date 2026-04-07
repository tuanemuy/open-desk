import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { createReport } from "./createReport";
import { disablePeriodicReport } from "./disablePeriodicReport";
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

describe("disablePeriodicReport", () => {
  it("should disable an enabled periodic report", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const report = await createReport({
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
    await enablePeriodicReport({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        reportId: report.reportId,
        interval: "DAILY",
        dayOfMonth: null,
        dayOfWeek: null,
        quarterMonth: null,
        hourMinute: { hour: 9, minute: 0 },
        minuteOfHour: null,
        timezone: "Asia/Tokyo",
        executorId: "user-1",
      },
    });
    const result = await disablePeriodicReport({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        reportId: report.reportId,
        executorId: "user-1",
      },
    });
    expect(result.isSettingsLocked).toBe(false);
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      disablePeriodicReport({
        container,
        headers: headers(),
        input: { appId: "bad", reportId: "r", executorId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent reportId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      disablePeriodicReport({
        container,
        headers: headers(),
        input: { appId: "app-1", reportId: "bad", executorId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      disablePeriodicReport({
        container,
        headers: headers(),
        input: { appId: "app-1", reportId: "r", executorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when periodic report is not enabled", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const report = await createReport({
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
    await expect(
      disablePeriodicReport({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          reportId: report.reportId,
          executorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
