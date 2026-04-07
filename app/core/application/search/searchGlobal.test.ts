import { v7 as uuidv7 } from "uuid";
import { describe, expect, it, vi } from "vitest";
import { BusinessRuleError } from "@/core/domain/error";
import { SearchErrorCode } from "@/core/domain/search/errorCode";
import type { SearchResult } from "@/core/domain/search/valueObject";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { SystemError } from "../error";
import { searchGlobal } from "./searchGlobal";

describe("searchGlobal", () => {
  const getContainer = setupTestContainer();

  const mockSearchResult = (
    overrides: Partial<SearchResult> = {},
  ): SearchResult => ({
    items: overrides.items ?? [],
    totalCount: overrides.totalCount ?? 0,
    offset: overrides.offset ?? 0,
    limit: overrides.limit ?? 10,
  });

  it("should return search results with valid keyword", async () => {
    const container = getContainer();
    const operatorId = uuidv7();
    const expectedResult = mockSearchResult({
      items: [
        {
          title: "Test Record",
          snippet: "matched <strong>keyword</strong>",
          sourceType: "RECORD",
          sourceId: uuidv7(),
          locationName: "App A",
          creatorName: "User A",
          createdAt: new Date(),
        },
      ],
      totalCount: 1,
      offset: 0,
      limit: 10,
    });

    vi.spyOn(container.searchIndexProvider, "search").mockResolvedValue(
      expectedResult,
    );

    const result = await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        keyword: "keyword",
        offset: 0,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Test Record");
    expect(result.totalCount).toBe(1);
  });

  it("should pass all filters when keyword, sourceTypes, dateFrom, dateTo, creatorId are specified", async () => {
    const container = getContainer();
    const operatorId = uuidv7();
    const creatorId = uuidv7();

    vi.spyOn(container.searchIndexProvider, "search").mockResolvedValue(
      mockSearchResult({ totalCount: 3 }),
    );

    const result = await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        keyword: "test",
        sourceTypes: ["RECORD"],
        dateFrom: new Date("2025-01-01"),
        dateTo: new Date("2025-12-31"),
        creatorId,
        offset: 0,
        limit: 10,
      },
    });

    expect(result.totalCount).toBe(3);
    expect(container.searchIndexProvider.search).toHaveBeenCalledTimes(1);
  });

  it("should target all 6 source types when sourceTypes is empty array", async () => {
    const container = getContainer();
    const operatorId = uuidv7();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(mockSearchResult());

    await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        keyword: "test",
        sourceTypes: [],
        offset: 0,
        limit: 10,
      },
    });

    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.sourceTypes).toHaveLength(0);
  });

  it("should return only RECORD results when sourceTypes is ['RECORD']", async () => {
    const container = getContainer();
    const operatorId = uuidv7();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(
        mockSearchResult({
          items: [
            {
              title: "Record",
              snippet: "record snippet",
              sourceType: "RECORD",
              sourceId: uuidv7(),
              locationName: "App",
              creatorName: "User",
              createdAt: new Date(),
            },
          ],
          totalCount: 1,
        }),
      );

    const result = await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        keyword: "test",
        sourceTypes: ["RECORD"],
        offset: 0,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].sourceType).toBe("RECORD");
    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.sourceTypes).toEqual(["RECORD"]);
  });

  it("should pass dateRange filter when dateFrom and dateTo are specified", async () => {
    const container = getContainer();
    const operatorId = uuidv7();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(mockSearchResult());

    await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        keyword: "test",
        dateFrom: new Date("2025-06-01"),
        dateTo: new Date("2025-06-30"),
        offset: 0,
        limit: 10,
      },
    });

    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.dateRange).not.toBeNull();
  });

  it("should pass creatorId filter when specified", async () => {
    const container = getContainer();
    const operatorId = uuidv7();
    const creatorId = uuidv7();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(mockSearchResult());

    await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        keyword: "test",
        creatorId,
        offset: 0,
        limit: 10,
      },
    });

    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.creatorId).toBe(creatorId);
  });

  it("should throw BusinessRuleError when keyword is empty", async () => {
    const container = getContainer();

    await expect(
      searchGlobal({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          keyword: "",
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);

    try {
      await searchGlobal({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          keyword: "",
          offset: 0,
          limit: 10,
        },
      });
    } catch (error) {
      expect((error as BusinessRuleError).code).toBe(
        SearchErrorCode.EmptyKeyword,
      );
    }
  });

  it("should throw BusinessRuleError when dateFrom > dateTo", async () => {
    const container = getContainer();

    await expect(
      searchGlobal({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          keyword: "test",
          dateFrom: new Date("2025-12-31"),
          dateTo: new Date("2025-01-01"),
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw SystemError when search engine fails", async () => {
    const container = getContainer();

    vi.spyOn(container.searchIndexProvider, "search").mockRejectedValue(
      new Error("Connection refused"),
    );

    await expect(
      searchGlobal({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          keyword: "test",
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(SystemError);
  });

  it("should throw BusinessRuleError when offset is negative", async () => {
    const container = getContainer();

    await expect(
      searchGlobal({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          keyword: "test",
          offset: -1,
          limit: 10,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when limit is 0", async () => {
    const container = getContainer();

    await expect(
      searchGlobal({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          keyword: "test",
          offset: 0,
          limit: 0,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when limit exceeds 100", async () => {
    const container = getContainer();

    await expect(
      searchGlobal({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          keyword: "test",
          offset: 0,
          limit: 101,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should return max 1 item with limit 1", async () => {
    const container = getContainer();

    vi.spyOn(container.searchIndexProvider, "search").mockResolvedValue(
      mockSearchResult({
        items: [
          {
            title: "One",
            snippet: "s",
            sourceType: "RECORD",
            sourceId: uuidv7(),
            locationName: "A",
            creatorName: "U",
            createdAt: new Date(),
          },
        ],
        totalCount: 10,
        limit: 1,
      }),
    );

    const result = await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        keyword: "test",
        offset: 0,
        limit: 1,
      },
    });

    expect(result.items).toHaveLength(1);
  });

  it("should return max 100 items with limit 100", async () => {
    const container = getContainer();

    vi.spyOn(container.searchIndexProvider, "search").mockResolvedValue(
      mockSearchResult({ totalCount: 200, limit: 100 }),
    );

    const result = await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        keyword: "test",
        offset: 0,
        limit: 100,
      },
    });

    expect(result.limit).toBe(100);
  });

  it("should return empty results when no data matches", async () => {
    const container = getContainer();

    vi.spyOn(container.searchIndexProvider, "search").mockResolvedValue(
      mockSearchResult({ items: [], totalCount: 0 }),
    );

    const result = await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        keyword: "nonexistent",
        offset: 0,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should pass dateFrom only (dateTo undefined) when only dateFrom is specified", async () => {
    const container = getContainer();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(mockSearchResult());

    await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        keyword: "test",
        dateFrom: new Date("2025-06-01"),
        offset: 0,
        limit: 10,
      },
    });

    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.dateRange).not.toBeNull();
    expect(calledQuery.filters.dateRange?.from).toEqual(new Date("2025-06-01"));
    expect(calledQuery.filters.dateRange?.to).toBeNull();
  });

  it("should pass dateTo only (dateFrom undefined) when only dateTo is specified", async () => {
    const container = getContainer();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(mockSearchResult());

    await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        keyword: "test",
        dateTo: new Date("2025-12-31"),
        offset: 0,
        limit: 10,
      },
    });

    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.dateRange).not.toBeNull();
    expect(calledQuery.filters.dateRange?.from).toBeNull();
    expect(calledQuery.filters.dateRange?.to).toEqual(new Date("2025-12-31"));
  });

  it("should accept same-day dateFrom and dateTo", async () => {
    const container = getContainer();
    const sameDay = new Date("2025-06-15");

    vi.spyOn(container.searchIndexProvider, "search").mockResolvedValue(
      mockSearchResult(),
    );

    const result = await searchGlobal({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        keyword: "test",
        dateFrom: sameDay,
        dateTo: sameDay,
        offset: 0,
        limit: 10,
      },
    });

    expect(result).toBeDefined();
  });
});
