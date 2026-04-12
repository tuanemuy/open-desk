import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { exportAuditLogsCsv } from "./exportAuditLogsCsv";

describe("exportAuditLogsCsv", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertUser(container: ReturnType<typeof getContainer>) {
    const userId = crypto.randomUUID();
    const hashed = await hasher.hash("password123");
    await container.db.insert(schema.users).values({
      id: userId,
      loginName: `user-${userId}@example.com`,
      displayName: "Test User",
      email: `user-${userId}@example.com`,
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });
    return userId;
  }

  function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  async function insertAuditLog(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<{
      level: string;
      timestamp: Date;
      sourceIp: string | null;
      userId: string | null;
      service: string;
      module: string;
      action: string;
      result: string;
      errorCode: string | null;
    }> = {},
  ) {
    const id = crypto.randomUUID();
    await container.db.insert(schema.auditLogs).values({
      id,
      level: overrides.level ?? "INFO",
      timestamp: overrides.timestamp ?? new Date(),
      sourceIp: overrides.sourceIp ?? null,
      userId: overrides.userId ?? null,
      service: overrides.service ?? "OPEN_DESK",
      module: overrides.module ?? "App management",
      action: overrides.action ?? "App create",
      result: overrides.result ?? "SUCCESS",
      errorCode: overrides.errorCode ?? null,
    });
    return id;
  }

  async function insertManyAuditLogs(
    container: ReturnType<typeof getContainer>,
    count: number,
    overrides: Partial<{
      level: string;
      service: string;
      module: string;
      action: string;
      result: string;
    }> = {},
  ) {
    const batchSize = 500;
    for (let i = 0; i < count; i += batchSize) {
      const batch = [];
      const end = Math.min(i + batchSize, count);
      for (let j = i; j < end; j++) {
        batch.push({
          id: crypto.randomUUID(),
          level: overrides.level ?? "INFO",
          timestamp: new Date(),
          sourceIp: null,
          userId: null,
          service: overrides.service ?? "OPEN_DESK",
          module: overrides.module ?? "App management",
          action: overrides.action ?? "App create",
          result: overrides.result ?? "SUCCESS",
          errorCode: null,
        });
      }
      await container.db.insert(schema.auditLogs).values(batch);
    }
  }

  const emptyFilter = {
    dateFrom: null,
    dateTo: null,
    level: null as "CRITICAL" | "INFO" | null,
    userId: null,
    service: null as "COMMON" | "OPEN_DESK" | "GAROON" | "CYBOZU_OFFICE" | null,
    module: null,
    action: null,
    result: null as "SUCCESS" | "FAILURE" | null,
  };

  it("should export all audit logs with totalCount", async () => {
    const container = getContainer();
    await insertAuditLog(container);
    await insertAuditLog(container);
    await insertAuditLog(container);

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: {
        filter: {
          ...emptyFilter,
          // Provide explicit dateFrom within retention to avoid timing edge case
          dateFrom: daysAgo(41),
        },
      },
    });

    expect(result.logs.length).toBe(3);
    expect(result.totalCount).toBe(3);
  });

  it("should return empty logs and totalCount 0 when no logs exist", async () => {
    const container = getContainer();

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter },
    });

    expect(result.logs).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should export many records up to the adapter limit", async () => {
    const container = getContainer();
    await insertManyAuditLogs(container, 500);

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter },
    });

    expect(result.logs.length).toBe(500);
    expect(result.totalCount).toBe(500);
  }, 30_000);

  it("should succeed when filtering reduces count", async () => {
    const container = getContainer();
    await insertManyAuditLogs(container, 100, { service: "OPEN_DESK" });
    await insertManyAuditLogs(container, 100, { service: "GAROON" });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: { ...emptyFilter, service: "OPEN_DESK" } },
    });

    expect(result.logs.length).toBe(100);
  }, 30_000);

  it("should filter by CRITICAL level", async () => {
    const container = getContainer();
    await insertAuditLog(container, { level: "CRITICAL" });
    await insertAuditLog(container, { level: "INFO" });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: { ...emptyFilter, level: "CRITICAL" } },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].level).toBe("CRITICAL");
  });

  it("should filter by userId", async () => {
    const container = getContainer();
    const userId1 = await insertUser(container);
    const userId2 = await insertUser(container);
    await insertAuditLog(container, { userId: userId1 });
    await insertAuditLog(container, { userId: userId2 });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: { ...emptyFilter, userId: userId1 } },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].userId).toBe(userId1);
  });

  it("should filter by service", async () => {
    const container = getContainer();
    await insertAuditLog(container, { service: "GAROON" });
    await insertAuditLog(container, { service: "OPEN_DESK" });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: { ...emptyFilter, service: "GAROON" } },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].service).toBe("GAROON");
  });

  it("should filter by module with partial match", async () => {
    const container = getContainer();
    await insertAuditLog(container, { module: "App management" });
    await insertAuditLog(container, { module: "User management" });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: { ...emptyFilter, module: "App" } },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].module).toContain("App");
  });

  it("should filter by action with partial match", async () => {
    const container = getContainer();
    await insertAuditLog(container, { action: "App create" });
    await insertAuditLog(container, { action: "App delete" });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: { ...emptyFilter, action: "create" } },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].action).toContain("create");
  });

  it("should filter by result", async () => {
    const container = getContainer();
    await insertAuditLog(container, { result: "SUCCESS" });
    await insertAuditLog(container, { result: "FAILURE" });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: { ...emptyFilter, result: "SUCCESS" } },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].result).toBe("SUCCESS");
  });

  it("should filter by dateFrom and dateTo", async () => {
    const container = getContainer();
    await insertAuditLog(container, { timestamp: daysAgo(1) });
    await insertAuditLog(container, { timestamp: daysAgo(5) });
    await insertAuditLog(container, { timestamp: daysAgo(10) });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: {
        filter: {
          ...emptyFilter,
          dateFrom: daysAgo(7),
          dateTo: daysAgo(0),
        },
      },
    });

    expect(result.logs.length).toBe(2);
  });

  it("should throw BusinessRuleError when dateFrom is after dateTo", async () => {
    const container = getContainer();

    await expect(
      exportAuditLogsCsv({
        container,
        headers: createMockHeaders(),
        input: {
          filter: {
            ...emptyFilter,
            dateFrom: daysAgo(1),
            dateTo: daysAgo(5),
          },
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when dateFrom is older than retention period", async () => {
    const container = getContainer();

    await expect(
      exportAuditLogsCsv({
        container,
        headers: createMockHeaders(),
        input: {
          filter: {
            ...emptyFilter,
            dateFrom: daysAgo(50),
          },
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should allow dateFrom within retention boundary", async () => {
    const container = getContainer();
    // Use a date slightly within the 6-week boundary to avoid sub-second timing issues
    const withinBoundary = daysAgo(41);
    await insertAuditLog(container, { timestamp: withinBoundary });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: {
        filter: {
          ...emptyFilter,
          dateFrom: withinBoundary,
        },
      },
    });

    expect(result.totalCount).toBeGreaterThanOrEqual(1);
  });

  it("should default dateFrom to retention period when not specified", async () => {
    const container = getContainer();
    await insertAuditLog(container, { timestamp: daysAgo(1) });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter },
    });

    expect(result.totalCount).toBeGreaterThanOrEqual(1);
  });

  it("should filter with combined conditions", async () => {
    const container = getContainer();
    await insertAuditLog(container, {
      level: "CRITICAL",
      service: "OPEN_DESK",
      timestamp: daysAgo(1),
    });
    await insertAuditLog(container, {
      level: "INFO",
      service: "GAROON",
      timestamp: daysAgo(2),
    });

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: {
        filter: {
          ...emptyFilter,
          level: "CRITICAL",
          service: "OPEN_DESK",
          dateFrom: daysAgo(3),
          dateTo: daysAgo(0),
        },
      },
    });

    expect(result.logs.length).toBe(1);
  });

  it("should export a single audit log", async () => {
    const container = getContainer();
    await insertAuditLog(container);

    const result = await exportAuditLogsCsv({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter },
    });

    expect(result.logs.length).toBe(1);
    expect(result.totalCount).toBe(1);
  });
});
