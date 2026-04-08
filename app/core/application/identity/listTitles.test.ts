import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { listTitles } from "./listTitles";

describe("listTitles", () => {
  const getContainer = setupTestContainer();

  async function insertTitle(
    container: ReturnType<typeof getContainer>,
    name: string,
    orderIndex = 0,
  ) {
    const id = crypto.randomUUID();
    await container.db.insert(schema.titles).values({
      id,
      name,
      orderIndex,
    });
    return id;
  }

  async function insertTitles(
    container: ReturnType<typeof getContainer>,
    count: number,
  ) {
    for (let i = 0; i < count; i++) {
      await insertTitle(container, `Title ${i}`);
    }
  }

  it("should return all titles when 5 exist", async () => {
    const container = getContainer();
    await insertTitles(container, 5);

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: {},
    });

    expect(result.titles).toHaveLength(5);
    expect(result.totalCount).toBe(5);
  });

  it("should return empty array when no titles exist", async () => {
    const container = getContainer();

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: {},
    });

    expect(result.titles).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should return first 10 titles with offset=0, limit=10 when 15 exist", async () => {
    const container = getContainer();
    await insertTitles(container, 15);

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: { offset: 0, limit: 10 },
    });

    expect(result.titles).toHaveLength(10);
    expect(result.totalCount).toBe(15);
  });

  it("should return remaining 5 titles with offset=10, limit=10 when 15 exist", async () => {
    const container = getContainer();
    await insertTitles(container, 15);

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: { offset: 10, limit: 10 },
    });

    expect(result.titles).toHaveLength(5);
    expect(result.totalCount).toBe(15);
  });

  it("should return empty array with offset=15, limit=10 when 15 exist", async () => {
    const container = getContainer();
    await insertTitles(container, 15);

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: { offset: 15, limit: 10 },
    });

    expect(result.titles).toHaveLength(0);
    expect(result.totalCount).toBe(15);
  });

  it("should use default offset=0 and limit=100 when omitted", async () => {
    const container = getContainer();
    await insertTitles(container, 5);

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: {},
    });

    expect(result.titles).toHaveLength(5);
    expect(result.totalCount).toBe(5);
  });

  it("should throw ValidationError when offset is negative", async () => {
    const container = getContainer();

    await expect(
      listTitles({
        container,
        headers: createMockHeaders(),
        input: { offset: -1 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 0", async () => {
    const container = getContainer();

    await expect(
      listTitles({
        container,
        headers: createMockHeaders(),
        input: { limit: 0 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 101", async () => {
    const container = getContainer();

    await expect(
      listTitles({
        container,
        headers: createMockHeaders(),
        input: { limit: 101 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should return 1 title with limit=1 (boundary value)", async () => {
    const container = getContainer();
    await insertTitles(container, 5);

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: { limit: 1 },
    });

    expect(result.titles).toHaveLength(1);
    expect(result.totalCount).toBe(5);
  });

  it("should accept limit=100 (boundary value)", async () => {
    const container = getContainer();
    await insertTitles(container, 5);

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: { limit: 100 },
    });

    expect(result.titles).toHaveLength(5);
    expect(result.totalCount).toBe(5);
  });

  it("should filter titles by keyword (partial match)", async () => {
    const container = getContainer();
    await insertTitle(container, "Manager");
    await insertTitle(container, "Senior Manager");
    await insertTitle(container, "Director");

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: { keyword: "Manager" },
    });

    expect(result.titles.length).toBeGreaterThanOrEqual(2);
    for (const title of result.titles) {
      expect(title.name).toContain("Manager");
    }
  });

  it("should return empty array when keyword does not match any title", async () => {
    const container = getContainer();
    await insertTitle(container, "Manager");

    const result = await listTitles({
      container,
      headers: createMockHeaders(),
      input: { keyword: "NonExistentKeyword" },
    });

    expect(result.titles).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });
});
