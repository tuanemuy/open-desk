import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { csvImportOrganizations } from "./csvImportOrganizations";

describe("csvImportOrganizations", () => {
  const getContainer = setupTestContainer();

  it("should import organizations from CSV with header", async () => {
    const container = getContainer();

    const csvContent = [
      "code,name,parentCode",
      "ORG001,Engineering,",
      "ORG002,Marketing,",
    ].join("\n");

    const result = await csvImportOrganizations({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: true,
      },
    });

    expect(result.importedCount).toBe(2);
    expect(result.skippedCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should import organizations with parent code", async () => {
    const container = getContainer();

    // Create parent org first
    const parentId = crypto.randomUUID();
    await container.db.insert(schema.organizations).values({
      id: parentId,
      code: "PARENT",
      name: "Parent Org",
      orderIndex: 0,
    });

    const csvContent = [
      "code,name,parentCode",
      "CHILD001,Child Engineering,PARENT",
    ].join("\n");

    const result = await csvImportOrganizations({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: true,
      },
    });

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
  });

  it("should skip rows with duplicate code", async () => {
    const container = getContainer();

    await container.db.insert(schema.organizations).values({
      id: crypto.randomUUID(),
      code: "EXISTING",
      name: "Existing Org",
      orderIndex: 0,
    });

    const csvContent = [
      "code,name,parentCode",
      "EXISTING,Duplicate Org,",
      "NEW001,New Org,",
    ].join("\n");

    const result = await csvImportOrganizations({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: true,
      },
    });

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.errors[0].message).toContain("already in use");
  });

  it("should skip rows with non-existent parent code", async () => {
    const container = getContainer();

    const csvContent = [
      "code,name,parentCode",
      "ORG001,Engineering,NONEXISTENT",
    ].join("\n");

    const result = await csvImportOrganizations({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: true,
      },
    });

    expect(result.importedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.errors[0].message).toContain("not found");
  });

  it("should skip rows with empty code", async () => {
    const container = getContainer();

    const csvContent = ["code,name,parentCode", ",Engineering,"].join("\n");

    const result = await csvImportOrganizations({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: true,
      },
    });

    expect(result.importedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.errors[0].message).toContain("code is empty");
  });

  it("should skip rows with empty name", async () => {
    const container = getContainer();

    const csvContent = ["code,name,parentCode", "ORG001,,"].join("\n");

    const result = await csvImportOrganizations({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: true,
      },
    });

    expect(result.importedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.errors[0].message).toContain("name is empty");
  });

  it("should throw ValidationError for empty CSV content", async () => {
    const container = getContainer();

    await expect(
      csvImportOrganizations({
        container,
        headers: createMockHeaders(),
        input: {
          csvContent: "",
          encoding: "utf-8",
          hasHeader: true,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should skip rows with insufficient columns", async () => {
    const container = getContainer();

    const csvContent = ["code,name,parentCode", "ORG001"].join("\n");

    const result = await csvImportOrganizations({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: true,
      },
    });

    expect(result.importedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.errors[0].message).toContain("Insufficient columns");
  });
});
