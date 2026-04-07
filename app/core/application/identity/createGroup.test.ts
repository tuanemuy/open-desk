import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ConflictError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { createGroup } from "./createGroup";

describe("createGroup", () => {
  const getContainer = setupTestContainer();

  it("should create group with valid name and code", async () => {
    const container = getContainer();

    const result = await createGroup({
      container,
      headers: createMockHeaders(),
      input: { name: "Engineering", code: "eng" },
    });

    expect(result.groupId).toBeDefined();
    expect(result.name).toBe("Engineering");
    expect(result.code).toBe("eng");
  });

  it("should throw ValidationError when name is empty", async () => {
    const container = getContainer();

    await expect(
      createGroup({
        container,
        headers: createMockHeaders(),
        input: { name: "", code: "eng" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when code is empty", async () => {
    const container = getContainer();

    await expect(
      createGroup({
        container,
        headers: createMockHeaders(),
        input: { name: "Engineering", code: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ConflictError when code already exists", async () => {
    const container = getContainer();

    await container.db.insert(schema.groups).values({
      id: crypto.randomUUID(),
      name: "Existing Group",
      code: "eng",
    });

    await expect(
      createGroup({
        container,
        headers: createMockHeaders(),
        input: { name: "New Group", code: "eng" },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should create multiple groups with unique codes", async () => {
    const container = getContainer();

    const result1 = await createGroup({
      container,
      headers: createMockHeaders(),
      input: { name: "Group A", code: "group-a" },
    });

    const result2 = await createGroup({
      container,
      headers: createMockHeaders(),
      input: { name: "Group B", code: "group-b" },
    });

    expect(result1.groupId).not.toBe(result2.groupId);
    expect(result1.code).toBe("group-a");
    expect(result2.code).toBe("group-b");
  });
});
