import { v7 as uuidv7 } from "uuid";
import { describe, expect, it, vi } from "vitest";
import { BusinessRuleError } from "@/core/domain/error";
import { SearchErrorCode } from "@/core/domain/search/errorCode";
import type { SearchResult } from "@/core/domain/search/valueObject";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { SystemError } from "../error";
import { searchInApp } from "./searchInApp";

describe("searchInApp", () => {
  const getContainer = setupTestContainer();

  const mockSearchResult = (
    overrides: Partial<SearchResult> = {},
  ): SearchResult => ({
    items: overrides.items ?? [],
    totalCount: overrides.totalCount ?? 0,
    offset: overrides.offset ?? 0,
    limit: overrides.limit ?? 10,
  });

  it("should return search results with valid appId and keyword", async () => {
    const container = getContainer();
    const operatorId = uuidv7();
    const appId = uuidv7();

    vi.spyOn(container.searchIndexProvider, "search").mockResolvedValue(
      mockSearchResult({
        items: [
          {
            title: "Record A",
            snippet: "matched",
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

    const result = await searchInApp({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        appId,
        keyword: "test",
        offset: 0,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it("should target all 3 source types (RECORD, COMMENT, FILE) when sourceTypes is empty", async () => {
    const container = getContainer();
    const operatorId = uuidv7();
    const appId = uuidv7();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(mockSearchResult());

    await searchInApp({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId,
        appId,
        keyword: "test",
        sourceTypes: [],
        offset: 0,
        limit: 10,
      },
    });

    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.sourceTypes).toHaveLength(0);
    expect(calledQuery.scope.type).toBe("APP");
  });

  it("should return only RECORD results when sourceTypes is ['RECORD']", async () => {
    const container = getContainer();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(mockSearchResult({ totalCount: 2 }));

    await searchInApp({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        appId: uuidv7(),
        keyword: "test",
        sourceTypes: ["RECORD"],
        offset: 0,
        limit: 10,
      },
    });

    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.sourceTypes).toEqual(["RECORD"]);
  });

  it("should return only COMMENT results when sourceTypes is ['COMMENT']", async () => {
    const container = getContainer();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(mockSearchResult());

    await searchInApp({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        appId: uuidv7(),
        keyword: "test",
        sourceTypes: ["COMMENT"],
        offset: 0,
        limit: 10,
      },
    });

    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.sourceTypes).toEqual(["COMMENT"]);
  });

  it("should return only FILE results when sourceTypes is ['FILE']", async () => {
    const container = getContainer();

    const searchSpy = vi
      .spyOn(container.searchIndexProvider, "search")
      .mockResolvedValue(mockSearchResult());

    await searchInApp({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        appId: uuidv7(),
        keyword: "test",
        sourceTypes: ["FILE"],
        offset: 0,
        limit: 10,
      },
    });

    const calledQuery = searchSpy.mock.calls[0][0];
    expect(calledQuery.filters.sourceTypes).toEqual(["FILE"]);
  });

  it("should throw BusinessRuleError when sourceTypes includes THREAD", async () => {
    const container = getContainer();

    await expect(
      searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
          keyword: "test",
          sourceTypes: ["THREAD"],
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);

    try {
      await searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
          keyword: "test",
          sourceTypes: ["THREAD"],
          offset: 0,
          limit: 10,
        },
      });
    } catch (error) {
      expect((error as BusinessRuleError).code).toBe(
        SearchErrorCode.UnavailableSourceType,
      );
    }
  });

  it("should throw BusinessRuleError when sourceTypes includes PEOPLE", async () => {
    const container = getContainer();

    await expect(
      searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
          keyword: "test",
          sourceTypes: ["PEOPLE"],
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when sourceTypes includes MESSAGE", async () => {
    const container = getContainer();

    await expect(
      searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
          keyword: "test",
          sourceTypes: ["MESSAGE"],
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when keyword is empty", async () => {
    const container = getContainer();

    await expect(
      searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
          keyword: "",
          offset: 0,
          limit: 10,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when dateFrom > dateTo", async () => {
    const container = getContainer();

    await expect(
      searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
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
      new Error("Search engine down"),
    );

    await expect(
      searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
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
      searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
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
      searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
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
      searchInApp({
        container,
        headers: createMockHeaders(),
        input: {
          operatorId: uuidv7(),
          appId: uuidv7(),
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
        totalCount: 5,
        limit: 1,
      }),
    );

    const result = await searchInApp({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        appId: uuidv7(),
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

    const result = await searchInApp({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        appId: uuidv7(),
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

    const result = await searchInApp({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        appId: uuidv7(),
        keyword: "nonexistent",
        offset: 0,
        limit: 10,
      },
    });

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should accept same-day dateFrom and dateTo", async () => {
    const container = getContainer();
    const sameDay = new Date("2025-06-15");

    vi.spyOn(container.searchIndexProvider, "search").mockResolvedValue(
      mockSearchResult(),
    );

    const result = await searchInApp({
      container,
      headers: createMockHeaders(),
      input: {
        operatorId: uuidv7(),
        appId: uuidv7(),
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
