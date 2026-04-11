import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { csvExportUsers } from "./csvExportUsers";

describe("csvExportUsers", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  it("should export users as CSV with header", async () => {
    const container = getContainer();
    const hashed = await hasher.hash("password123");

    await container.db.insert(schema.users).values({
      id: crypto.randomUUID(),
      loginName: "user1@example.com",
      displayName: "User One",
      email: "user1@example.com",
      timezone: "Asia/Tokyo",
      language: "ja",
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });

    await container.db.insert(schema.users).values({
      id: crypto.randomUUID(),
      loginName: "user2@example.com",
      displayName: "User Two",
      email: "user2@example.com",
      timezone: "America/New_York",
      language: "en",
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: false,
    });

    const result = await csvExportUsers({
      container,
      headers: createMockHeaders(),
      input: { encoding: "utf-8" },
    });

    expect(result.totalCount).toBe(2);
    expect(result.fileName).toMatch(/^users_\d{8}_\d{6}\.csv$/);

    const lines = result.csvContent.split("\n");
    expect(lines[0]).toBe(
      "loginName,displayName,email,timezone,language,isActive",
    );
    expect(lines).toHaveLength(3);

    expect(lines[1]).toContain("user1@example.com");
    expect(lines[1]).toContain("User One");
    expect(lines[1]).toContain("true");
  });

  it("should return empty CSV with only header when no users", async () => {
    const container = getContainer();

    const result = await csvExportUsers({
      container,
      headers: createMockHeaders(),
      input: { encoding: "utf-8" },
    });

    expect(result.totalCount).toBe(0);
    const lines = result.csvContent.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(
      "loginName,displayName,email,timezone,language,isActive",
    );
  });

  it("should escape fields with commas", async () => {
    const container = getContainer();
    const hashed = await hasher.hash("password123");

    await container.db.insert(schema.users).values({
      id: crypto.randomUUID(),
      loginName: "user1@example.com",
      displayName: "Last, First",
      email: "user1@example.com",
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });

    const result = await csvExportUsers({
      container,
      headers: createMockHeaders(),
      input: { encoding: "utf-8" },
    });

    const lines = result.csvContent.split("\n");
    expect(lines[1]).toContain('"Last, First"');
  });
});
