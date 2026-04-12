import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { getAuditLogSettings } from "./getAuditLogSettings";
import { updateAuditLogSettings } from "./updateAuditLogSettings";

describe("updateAuditLogSettings", () => {
  const getContainer = setupTestContainer();

  it("should update existing audit log settings", async () => {
    const container = getContainer();

    // Create initial settings
    const now = new Date();
    await container.db.insert(schema.auditLogSettings).values({
      id: crypto.randomUUID(),
      settings: { retentionWeeks: 6 },
      createdAt: now,
      updatedAt: now,
    });

    const result = await updateAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: { settings: { retentionWeeks: 12, notifyOnCritical: true } },
    });

    expect(result.setting.settings).toEqual({
      retentionWeeks: 12,
      notifyOnCritical: true,
    });
    expect(result.setting.updatedAt).toBeInstanceOf(Date);
  });

  it("should create new settings when none exist", async () => {
    const container = getContainer();

    const result = await updateAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: { settings: { retentionWeeks: 8 } },
    });

    expect(result.setting.settings).toEqual({ retentionWeeks: 8 });
    expect(result.setting.createdAt).toBeInstanceOf(Date);
    expect(result.setting.updatedAt).toBeInstanceOf(Date);
  });

  it("should return same values when updating with identical settings (idempotency)", async () => {
    const container = getContainer();

    const settings = { retentionWeeks: 6, logLevel: "INFO" };

    await updateAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: { settings },
    });

    const result = await updateAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: { settings },
    });

    expect(result.setting.settings).toEqual(settings);
  });

  it("should update only changed fields while preserving the new settings object", async () => {
    const container = getContainer();

    // Set initial settings
    await updateAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: {
        settings: { retentionWeeks: 6, notifyOnCritical: false },
      },
    });

    // Update with partial changes - note: updateSettings replaces the entire settings
    const result = await updateAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: {
        settings: { retentionWeeks: 6, notifyOnCritical: true },
      },
    });

    expect(result.setting.settings).toEqual({
      retentionWeeks: 6,
      notifyOnCritical: true,
    });

    // Verify it was persisted
    const fetched = await getAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(fetched.setting.settings).toEqual({
      retentionWeeks: 6,
      notifyOnCritical: true,
    });
  });

  it("should update updatedAt timestamp on update", async () => {
    const container = getContainer();

    // Create initial settings
    const firstResult = await updateAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: { settings: { key: "value1" } },
    });

    const firstUpdatedAt = firstResult.setting.updatedAt;

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    const secondResult = await updateAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: { settings: { key: "value2" } },
    });

    expect(secondResult.setting.updatedAt.getTime()).toBeGreaterThanOrEqual(
      firstUpdatedAt.getTime(),
    );
  });
});
