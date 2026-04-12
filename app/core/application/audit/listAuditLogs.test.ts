import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { listAuditLogs } from "./listAuditLogs";

describe("listAuditLogs", () => {
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

  it("should return audit logs in descending order with totalCount", async () => {
    const container = getContainer();
    for (let i = 0; i < 5; i++) {
      await insertAuditLog(container, { timestamp: daysAgo(i) });
    }

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter, limit: 10, offset: 0 },
    });

    expect(result.logs.length).toBe(5);
    expect(result.totalCount).toBe(5);
    // Verify descending order
    for (let i = 1; i < result.logs.length; i++) {
      expect(result.logs[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
        result.logs[i].timestamp.getTime(),
      );
    }
  });

  it("should return empty logs and totalCount 0 when no logs exist", async () => {
    const container = getContainer();

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter, limit: 10, offset: 0 },
    });

    expect(result.logs).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should return first page with correct totalCount for pagination", async () => {
    const container = getContainer();
    for (let i = 0; i < 15; i++) {
      await insertAuditLog(container, {
        timestamp: daysAgo(i),
        module: `Module ${i}`,
      });
    }

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter, limit: 10, offset: 0 },
    });

    expect(result.logs.length).toBe(10);
    expect(result.totalCount).toBe(15);
  });

  it("should return remaining items for second page", async () => {
    const container = getContainer();
    for (let i = 0; i < 15; i++) {
      await insertAuditLog(container, {
        timestamp: daysAgo(i),
        module: `Module ${i}`,
      });
    }

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter, limit: 10, offset: 10 },
    });

    expect(result.logs.length).toBe(5);
    expect(result.totalCount).toBe(15);
  });

  it("should return empty logs when offset exceeds total", async () => {
    const container = getContainer();
    for (let i = 0; i < 15; i++) {
      await insertAuditLog(container, {
        timestamp: daysAgo(i),
        module: `Module ${i}`,
      });
    }

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter, limit: 10, offset: 15 },
    });

    expect(result.logs).toHaveLength(0);
    expect(result.totalCount).toBe(15);
  });

  it("should filter by CRITICAL level", async () => {
    const container = getContainer();
    await insertAuditLog(container, { level: "CRITICAL" });
    await insertAuditLog(container, { level: "INFO" });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: { ...emptyFilter, level: "CRITICAL" },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].level).toBe("CRITICAL");
  });

  it("should filter by INFO level", async () => {
    const container = getContainer();
    await insertAuditLog(container, { level: "CRITICAL" });
    await insertAuditLog(container, { level: "INFO" });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: { ...emptyFilter, level: "INFO" },
        limit: 10,
        offset: 0,
      },
    });

    // INFO level filter uses exact match, returning only INFO logs
    expect(result.logs.length).toBe(1);
    expect(result.logs[0].level).toBe("INFO");
  });

  it("should filter by userId", async () => {
    const container = getContainer();
    const userId1 = await insertUser(container);
    const userId2 = await insertUser(container);
    await insertAuditLog(container, { userId: userId1 });
    await insertAuditLog(container, { userId: userId2 });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: { ...emptyFilter, userId: userId1 },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].userId).toBe(userId1);
  });

  it("should filter by service", async () => {
    const container = getContainer();
    await insertAuditLog(container, { service: "OPEN_DESK" });
    await insertAuditLog(container, { service: "GAROON" });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: { ...emptyFilter, service: "OPEN_DESK" },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].service).toBe("OPEN_DESK");
  });

  it("should filter by module with partial match", async () => {
    const container = getContainer();
    await insertAuditLog(container, { module: "App management" });
    await insertAuditLog(container, { module: "User management" });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: { ...emptyFilter, module: "App" },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].module).toContain("App");
  });

  it("should filter by action with partial match", async () => {
    const container = getContainer();
    await insertAuditLog(container, { action: "App create" });
    await insertAuditLog(container, { action: "App delete" });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: { ...emptyFilter, action: "create" },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].action).toContain("create");
  });

  it("should filter by result", async () => {
    const container = getContainer();
    await insertAuditLog(container, { result: "SUCCESS" });
    await insertAuditLog(container, { result: "FAILURE" });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: { ...emptyFilter, result: "FAILURE" },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].result).toBe("FAILURE");
  });

  it("should filter by dateFrom and dateTo", async () => {
    const container = getContainer();
    await insertAuditLog(container, { timestamp: daysAgo(1) });
    await insertAuditLog(container, { timestamp: daysAgo(5) });
    await insertAuditLog(container, { timestamp: daysAgo(10) });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: {
          ...emptyFilter,
          dateFrom: daysAgo(7),
          dateTo: daysAgo(0),
        },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.logs.length).toBe(2);
  });

  it("should filter by dateFrom only", async () => {
    const container = getContainer();
    await insertAuditLog(container, { timestamp: daysAgo(1) });
    await insertAuditLog(container, { timestamp: daysAgo(10) });
    await insertAuditLog(container, { timestamp: daysAgo(20) });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: {
          ...emptyFilter,
          dateFrom: daysAgo(15),
          dateTo: null,
        },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.logs.length).toBe(2);
  });

  it("should filter by dateTo only", async () => {
    const container = getContainer();
    await insertAuditLog(container, { timestamp: daysAgo(1) });
    await insertAuditLog(container, { timestamp: daysAgo(5) });
    await insertAuditLog(container, { timestamp: daysAgo(10) });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: {
          ...emptyFilter,
          dateFrom: null,
          dateTo: daysAgo(3),
        },
        limit: 10,
        offset: 0,
      },
    });

    // dateFrom defaults to 6 weeks ago, so logs within retention and before dateTo
    expect(result.logs.length).toBe(2);
  });

  it("should default dateFrom to retention period when not specified", async () => {
    const container = getContainer();
    await insertAuditLog(container, { timestamp: daysAgo(1) });
    await insertAuditLog(container, { timestamp: daysAgo(30) });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter, limit: 10, offset: 0 },
    });

    // Both should be within 6-week retention (42 days)
    expect(result.logs.length).toBe(2);
  });

  it("should filter with combined conditions", async () => {
    const container = getContainer();
    await insertAuditLog(container, {
      level: "CRITICAL",
      service: "OPEN_DESK",
      result: "FAILURE",
    });
    await insertAuditLog(container, {
      level: "CRITICAL",
      service: "GAROON",
      result: "FAILURE",
    });
    await insertAuditLog(container, {
      level: "INFO",
      service: "OPEN_DESK",
      result: "SUCCESS",
    });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: {
          ...emptyFilter,
          level: "CRITICAL",
          service: "OPEN_DESK",
          result: "FAILURE",
        },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.logs.length).toBe(1);
    expect(result.logs[0].level).toBe("CRITICAL");
    expect(result.logs[0].service).toBe("OPEN_DESK");
    expect(result.logs[0].result).toBe("FAILURE");
  });

  it("should throw BusinessRuleError when dateFrom is after dateTo", async () => {
    const container = getContainer();

    await expect(
      listAuditLogs({
        container,
        headers: createMockHeaders(),
        input: {
          filter: {
            ...emptyFilter,
            dateFrom: daysAgo(1),
            dateTo: daysAgo(5),
          },
          limit: 10,
          offset: 0,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when dateFrom is older than retention period", async () => {
    const container = getContainer();

    await expect(
      listAuditLogs({
        container,
        headers: createMockHeaders(),
        input: {
          filter: {
            ...emptyFilter,
            dateFrom: daysAgo(50), // Older than 6 weeks (42 days)
          },
          limit: 10,
          offset: 0,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should allow dateFrom at retention boundary (slightly within)", async () => {
    const container = getContainer();
    // Use a date slightly within the 6-week boundary to avoid sub-second timing issues
    const withinBoundary = daysAgo(41);
    await insertAuditLog(container, { timestamp: withinBoundary });

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: {
        filter: {
          ...emptyFilter,
          dateFrom: withinBoundary,
        },
        limit: 10,
        offset: 0,
      },
    });

    expect(result.totalCount).toBeGreaterThanOrEqual(1);
  });

  it("should return 1 log when limit is 1", async () => {
    const container = getContainer();
    await insertAuditLog(container);
    await insertAuditLog(container);

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter, limit: 1, offset: 0 },
    });

    expect(result.logs.length).toBe(1);
  });

  it("should start from the beginning when offset is 0", async () => {
    const container = getContainer();
    await insertAuditLog(container);

    const result = await listAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { filter: emptyFilter, limit: 10, offset: 0 },
    });

    expect(result.logs.length).toBe(1);
  });
});
