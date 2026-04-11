import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { csvImportGroups } from "./csvImportGroups";

describe("csvImportGroups", () => {
  const getContainer = setupTestContainer();

  it("should import groups from CSV with header", async () => {
    const container = getContainer();

    const csvContent = [
      "code,name",
      "GRP001,Engineering Team",
      "GRP002,Marketing Team",
    ].join("\n");

    const result = await csvImportGroups({
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

  it("should import groups from CSV without header", async () => {
    const container = getContainer();

    const csvContent = ["GRP001,Engineering Team"].join("\n");

    const result = await csvImportGroups({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: false,
      },
    });

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
  });

  it("should skip rows with duplicate code", async () => {
    const container = getContainer();

    await container.db.insert(schema.groups).values({
      id: crypto.randomUUID(),
      code: "EXISTING",
      name: "Existing Group",
    });

    const csvContent = [
      "code,name",
      "EXISTING,Duplicate Group",
      "NEW001,New Group",
    ].join("\n");

    const result = await csvImportGroups({
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

  it("should skip rows with empty code", async () => {
    const container = getContainer();

    const csvContent = ["code,name", ",Engineering Team"].join("\n");

    const result = await csvImportGroups({
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

    const csvContent = ["code,name", "GRP001,"].join("\n");

    const result = await csvImportGroups({
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
      csvImportGroups({
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

    const csvContent = ["code,name", "GRP001"].join("\n");

    const result = await csvImportGroups({
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

  it("should handle CSV with quoted fields", async () => {
    const container = getContainer();

    const csvContent = ["code,name", 'GRP001,"Engineering, Team"'].join("\n");

    const result = await csvImportGroups({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: true,
      },
    });

    expect(result.importedCount).toBe(1);
    expect(result.errors).toHaveLength(0);
  });
});
