import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { csvExportGroups } from "./csvExportGroups";

describe("csvExportGroups", () => {
  const getContainer = setupTestContainer();

  it("should export groups as CSV with header", async () => {
    const container = getContainer();

    await container.db.insert(schema.groups).values({
      id: crypto.randomUUID(),
      code: "GRP001",
      name: "Engineering Team",
    });

    await container.db.insert(schema.groups).values({
      id: crypto.randomUUID(),
      code: "GRP002",
      name: "Marketing Team",
    });

    const result = await csvExportGroups({
      container,
      headers: createMockHeaders(),
      input: { encoding: "utf-8" },
    });

    expect(result.totalCount).toBe(2);
    expect(result.fileName).toMatch(/^groups_\d{8}_\d{6}\.csv$/);

    const lines = result.csvContent.split("\n");
    expect(lines[0]).toBe("code,name");
    expect(lines).toHaveLength(3);
  });

  it("should return empty CSV with only header when no groups", async () => {
    const container = getContainer();

    const result = await csvExportGroups({
      container,
      headers: createMockHeaders(),
      input: { encoding: "utf-8" },
    });

    expect(result.totalCount).toBe(0);
    const lines = result.csvContent.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("code,name");
  });

  it("should escape fields with commas", async () => {
    const container = getContainer();

    await container.db.insert(schema.groups).values({
      id: crypto.randomUUID(),
      code: "GRP001",
      name: "Engineering, Development",
    });

    const result = await csvExportGroups({
      container,
      headers: createMockHeaders(),
      input: { encoding: "utf-8" },
    });

    const lines = result.csvContent.split("\n");
    expect(lines[1]).toContain('"Engineering, Development"');
  });
});
