import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { csvExportOrganizations } from "./csvExportOrganizations";

describe("csvExportOrganizations", () => {
  const getContainer = setupTestContainer();

  it("should export organizations as CSV with header", async () => {
    const container = getContainer();

    const parentId = crypto.randomUUID();
    await container.db.insert(schema.organizations).values({
      id: parentId,
      code: "PARENT",
      name: "Parent Org",
      orderIndex: 0,
    });

    await container.db.insert(schema.organizations).values({
      id: crypto.randomUUID(),
      code: "CHILD",
      name: "Child Org",
      parentOrganizationId: parentId,
      orderIndex: 1,
    });

    const result = await csvExportOrganizations({
      container,
      headers: createMockHeaders(),
      input: { encoding: "utf-8" },
    });

    expect(result.totalCount).toBe(2);
    expect(result.fileName).toMatch(/^organizations_\d{8}_\d{6}\.csv$/);

    const lines = result.csvContent.split("\n");
    expect(lines[0]).toBe("code,name,parentCode");
    expect(lines).toHaveLength(3);

    // The parent org should have empty parentCode
    const parentLine = lines.find((l) => l.startsWith("PARENT,"));
    expect(parentLine).toBeDefined();
    expect(parentLine).toBe("PARENT,Parent Org,");

    // The child org should have PARENT as parentCode
    const childLine = lines.find((l) => l.startsWith("CHILD,"));
    expect(childLine).toBeDefined();
    expect(childLine).toBe("CHILD,Child Org,PARENT");
  });

  it("should return empty CSV with only header when no organizations", async () => {
    const container = getContainer();

    const result = await csvExportOrganizations({
      container,
      headers: createMockHeaders(),
      input: { encoding: "utf-8" },
    });

    expect(result.totalCount).toBe(0);
    const lines = result.csvContent.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("code,name,parentCode");
  });

  it("should escape fields with commas", async () => {
    const container = getContainer();

    await container.db.insert(schema.organizations).values({
      id: crypto.randomUUID(),
      code: "ORG001",
      name: "Engineering, Development",
      orderIndex: 0,
    });

    const result = await csvExportOrganizations({
      container,
      headers: createMockHeaders(),
      input: { encoding: "utf-8" },
    });

    const lines = result.csvContent.split("\n");
    expect(lines[1]).toContain('"Engineering, Development"');
  });
});
