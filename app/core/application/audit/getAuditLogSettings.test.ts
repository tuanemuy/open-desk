import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { getAuditLogSettings } from "./getAuditLogSettings";
import { updateAuditLogSettings } from "./updateAuditLogSettings";

describe("getAuditLogSettings", () => {
  const getContainer = setupTestContainer();

  it("should return saved audit log settings", async () => {
    const container = getContainer();

    // First, save settings via insert
    const now = new Date();
    await container.db.insert(schema.auditLogSettings).values({
      id: crypto.randomUUID(),
      settings: { retentionWeeks: 8, notifyOnCritical: true },
      createdAt: now,
      updatedAt: now,
    });

    const result = await getAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.setting).toBeDefined();
    expect(result.setting.settings).toEqual({
      retentionWeeks: 8,
      notifyOnCritical: true,
    });
    expect(result.setting.createdAt).toBeInstanceOf(Date);
    expect(result.setting.updatedAt).toBeInstanceOf(Date);
  });

  it("should return default settings when not yet created", async () => {
    const container = getContainer();

    const result = await getAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.setting).toBeDefined();
    expect(result.setting.settings).toBeDefined();
    expect(result.setting.createdAt).toBeInstanceOf(Date);
    expect(result.setting.updatedAt).toBeInstanceOf(Date);
  });

  it("should return updated settings after an update", async () => {
    const container = getContainer();

    // Update settings first
    await updateAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: { settings: { retentionWeeks: 12, feature: "enabled" } },
    });

    const result = await getAuditLogSettings({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.setting.settings).toEqual({
      retentionWeeks: 12,
      feature: "enabled",
    });
  });
});
