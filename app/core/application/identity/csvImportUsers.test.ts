import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { csvImportUsers } from "./csvImportUsers";

describe("csvImportUsers", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  it("should import users from CSV with header", async () => {
    const container = getContainer();

    const csvContent = [
      "loginName,displayName,email,timezone,language,isActive",
      "user1@example.com,User One,user1@example.com,Asia/Tokyo,ja,true",
      "user2@example.com,User Two,user2@example.com,America/New_York,en,true",
    ].join("\n");

    const result = await csvImportUsers({
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

  it("should import users from CSV without header", async () => {
    const container = getContainer();

    const csvContent = [
      "user1@example.com,User One,user1@example.com,Asia/Tokyo,ja,true",
    ].join("\n");

    const result = await csvImportUsers({
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
    expect(result.errors).toHaveLength(0);
  });

  it("should use default timezone and language when not provided", async () => {
    const container = getContainer();

    const csvContent = [
      "loginName,displayName,email",
      "user1@example.com,User One,user1@example.com",
    ].join("\n");

    const result = await csvImportUsers({
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

  it("should skip rows with duplicate loginName", async () => {
    const container = getContainer();
    const hashed = await hasher.hash("password123");

    await container.db.insert(schema.users).values({
      id: crypto.randomUUID(),
      loginName: "existing@example.com",
      displayName: "Existing User",
      email: "existing@example.com",
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });

    const csvContent = [
      "loginName,displayName,email",
      "existing@example.com,Duplicate User,diff@example.com",
      "new@example.com,New User,new@example.com",
    ].join("\n");

    const result = await csvImportUsers({
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
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
    expect(result.errors[0].message).toContain("already in use");
  });

  it("should skip rows with empty displayName", async () => {
    const container = getContainer();

    const csvContent = [
      "loginName,displayName,email",
      "user1@example.com,,user1@example.com",
    ].join("\n");

    const result = await csvImportUsers({
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
    expect(result.errors[0].message).toContain("Display name is empty");
  });

  it("should skip rows with insufficient columns", async () => {
    const container = getContainer();

    const csvContent = [
      "loginName,displayName,email",
      "user1@example.com,User One",
    ].join("\n");

    const result = await csvImportUsers({
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

  it("should throw ValidationError for empty CSV content", async () => {
    const container = getContainer();

    await expect(
      csvImportUsers({
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

  it("should throw ValidationError when only header row is present", async () => {
    const container = getContainer();

    await expect(
      csvImportUsers({
        container,
        headers: createMockHeaders(),
        input: {
          csvContent: "loginName,displayName,email",
          encoding: "utf-8",
          hasHeader: true,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should handle inactive users", async () => {
    const container = getContainer();

    const csvContent = [
      "loginName,displayName,email,timezone,language,isActive",
      "inactive@example.com,Inactive User,inactive@example.com,Asia/Tokyo,ja,false",
    ].join("\n");

    const result = await csvImportUsers({
      container,
      headers: createMockHeaders(),
      input: {
        csvContent,
        encoding: "utf-8",
        hasHeader: true,
      },
    });

    expect(result.importedCount).toBe(1);

    const user = await container.unitOfWorkProvider.transaction(async (ctx) => {
      return ctx.userRepository.findByLoginName(
        "inactive@example.com" as import("@/core/domain/identity/valueObject").LoginName,
      );
    });

    expect(user).not.toBeNull();
    expect(user?.isActive).toBe(false);
  });

  it("should handle CSV with quoted fields", async () => {
    const container = getContainer();

    const csvContent = [
      "loginName,displayName,email",
      'user1@example.com,"User, One",user1@example.com',
    ].join("\n");

    const result = await csvImportUsers({
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

  it("should skip rows with invalid loginName format", async () => {
    const container = getContainer();

    const csvContent = [
      "loginName,displayName,email",
      "not-an-email,User One,user1@example.com",
    ].join("\n");

    const result = await csvImportUsers({
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
    expect(result.errors).toHaveLength(1);
  });
});
