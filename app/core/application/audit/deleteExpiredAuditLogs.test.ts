import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { deleteExpiredAuditLogs } from "./deleteExpiredAuditLogs";

describe("deleteExpiredAuditLogs", () => {
  const getContainer = setupTestContainer();

  function weeksAgo(weeks: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - weeks * 7);
    return d;
  }

  function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  async function insertAuditLog(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<{
      timestamp: Date;
    }> = {},
  ) {
    const id = crypto.randomUUID();
    await container.db.insert(schema.auditLogs).values({
      id,
      level: "INFO",
      timestamp: overrides.timestamp ?? new Date(),
      sourceIp: null,
      userId: null,
      service: "OPEN_DESK",
      module: "App management",
      action: "App create",
      result: "SUCCESS",
      errorCode: null,
    });
    return id;
  }

  async function countAuditLogs(
    container: ReturnType<typeof getContainer>,
  ): Promise<number> {
    const rows = await container.db.select().from(schema.auditLogs);
    return rows.length;
  }

  it("should delete expired audit logs and return deleted count", async () => {
    const container = getContainer();
    // Insert logs older than 6 weeks
    await insertAuditLog(container, { timestamp: weeksAgo(7) });
    await insertAuditLog(container, { timestamp: weeksAgo(8) });
    // Insert a log within retention
    await insertAuditLog(container, { timestamp: daysAgo(1) });

    const result = await deleteExpiredAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { retentionWeeks: 6 },
    });

    expect(result.deletedCount).toBe(2);
    expect(await countAuditLogs(container)).toBe(1);
  });

  it("should return 0 when no logs are expired", async () => {
    const container = getContainer();
    await insertAuditLog(container, { timestamp: daysAgo(1) });
    await insertAuditLog(container, { timestamp: daysAgo(10) });

    const result = await deleteExpiredAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { retentionWeeks: 6 },
    });

    expect(result.deletedCount).toBe(0);
    expect(await countAuditLogs(container)).toBe(2);
  });

  it("should handle boundary correctly - only delete logs exceeding retention", async () => {
    const container = getContainer();
    // Exactly at the boundary (42 days ago for 6 weeks) - should not be deleted
    const exactBoundary = weeksAgo(6);
    // Just past the boundary - should be deleted
    const pastBoundary = new Date(exactBoundary);
    pastBoundary.setSeconds(pastBoundary.getSeconds() - 1);

    await insertAuditLog(container, { timestamp: pastBoundary });
    await insertAuditLog(container, { timestamp: daysAgo(1) });

    const result = await deleteExpiredAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { retentionWeeks: 6 },
    });

    // The past-boundary log should be deleted
    expect(result.deletedCount).toBe(1);
    expect(await countAuditLogs(container)).toBe(1);
  });

  it("should delete only expired logs while keeping valid ones", async () => {
    const container = getContainer();
    await insertAuditLog(container, { timestamp: weeksAgo(10) });
    await insertAuditLog(container, { timestamp: weeksAgo(7) });
    await insertAuditLog(container, { timestamp: daysAgo(1) });
    await insertAuditLog(container, { timestamp: daysAgo(5) });

    const result = await deleteExpiredAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { retentionWeeks: 6 },
    });

    expect(result.deletedCount).toBe(2);
    expect(await countAuditLogs(container)).toBe(2);
  });

  it("should delete all expired logs in a large batch", async () => {
    const container = getContainer();
    // Insert many expired logs
    for (let i = 0; i < 100; i++) {
      await insertAuditLog(container, { timestamp: weeksAgo(10) });
    }
    // Insert a few valid logs
    await insertAuditLog(container, { timestamp: daysAgo(1) });

    const result = await deleteExpiredAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { retentionWeeks: 6 },
    });

    expect(result.deletedCount).toBe(100);
    expect(await countAuditLogs(container)).toBe(1);
  });

  it("should use retentionWeeks 1 to delete logs older than 1 week", async () => {
    const container = getContainer();
    await insertAuditLog(container, { timestamp: daysAgo(10) }); // Older than 1 week
    await insertAuditLog(container, { timestamp: daysAgo(1) }); // Within 1 week

    const result = await deleteExpiredAuditLogs({
      container,
      headers: createMockHeaders(),
      input: { retentionWeeks: 1 },
    });

    expect(result.deletedCount).toBe(1);
    expect(await countAuditLogs(container)).toBe(1);
  });

  it("should throw ValidationError when retentionWeeks is 0", async () => {
    const container = getContainer();

    await expect(
      deleteExpiredAuditLogs({
        container,
        headers: createMockHeaders(),
        input: { retentionWeeks: 0 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when retentionWeeks is negative", async () => {
    const container = getContainer();

    await expect(
      deleteExpiredAuditLogs({
        container,
        headers: createMockHeaders(),
        input: { retentionWeeks: -1 },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
