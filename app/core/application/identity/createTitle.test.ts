import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ConflictError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { createTitle } from "./createTitle";

describe("createTitle", () => {
  const getContainer = setupTestContainer();

  it("should create title with valid name", async () => {
    const container = getContainer();

    const result = await createTitle({
      container,
      headers: createMockHeaders(),
      input: { name: "Manager" },
    });

    expect(result.titleId).toBeDefined();
    expect(result.name).toBe("Manager");
    expect(result.orderIndex).toBe(0);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should create title with orderIndex omitted (default 0)", async () => {
    const container = getContainer();

    const result = await createTitle({
      container,
      headers: createMockHeaders(),
      input: { name: "Engineer" },
    });

    expect(result.orderIndex).toBe(0);
  });

  it("should create title with orderIndex specified as 5", async () => {
    const container = getContainer();

    const result = await createTitle({
      container,
      headers: createMockHeaders(),
      input: { name: "Director", orderIndex: 5 },
    });

    expect(result.orderIndex).toBe(5);
  });

  it("should create title with orderIndex 0 (boundary value)", async () => {
    const container = getContainer();

    const result = await createTitle({
      container,
      headers: createMockHeaders(),
      input: { name: "Intern", orderIndex: 0 },
    });

    expect(result.orderIndex).toBe(0);
  });

  it("should throw ValidationError when name is empty", async () => {
    const container = getContainer();

    await expect(
      createTitle({
        container,
        headers: createMockHeaders(),
        input: { name: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when orderIndex is negative", async () => {
    const container = getContainer();

    await expect(
      createTitle({
        container,
        headers: createMockHeaders(),
        input: { name: "Manager", orderIndex: -1 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ConflictError when name already exists", async () => {
    const container = getContainer();

    await container.db.insert(schema.titles).values({
      id: crypto.randomUUID(),
      name: "Manager",
      orderIndex: 0,
    });

    await expect(
      createTitle({
        container,
        headers: createMockHeaders(),
        input: { name: "Manager" },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should create multiple titles with unique names", async () => {
    const container = getContainer();

    const result1 = await createTitle({
      container,
      headers: createMockHeaders(),
      input: { name: "Title A" },
    });

    const result2 = await createTitle({
      container,
      headers: createMockHeaders(),
      input: { name: "Title B" },
    });

    expect(result1.titleId).not.toBe(result2.titleId);
    expect(result1.name).toBe("Title A");
    expect(result2.name).toBe("Title B");
  });
});
