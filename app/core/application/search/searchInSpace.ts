import { UserId } from "@/core/domain/identity/valueObject";
import {
  DateRange,
  SearchFilter,
  SearchQuery,
  SearchScope,
  type SourceType,
} from "@/core/domain/search/valueObject";
import { SpaceId } from "@/core/domain/space/valueObject";
import { SystemError, SystemErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { SearchOutput } from "./dto";

export type SearchInSpaceInput = {
  operatorId: string;
  spaceId: string;
  keyword: string;
  sourceTypes?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  creatorId?: string;
  offset: number;
  limit: number;
};

export async function searchInSpace({
  container,
  input,
}: ServiceArgs<SearchInSpaceInput>): Promise<SearchOutput> {
  const spaceId = SpaceId.create(input.spaceId);
  const scope = SearchScope.space(spaceId);
  const dateRange =
    input.dateFrom !== undefined || input.dateTo !== undefined
      ? DateRange.create(input.dateFrom ?? null, input.dateTo ?? null)
      : null;
  const creatorId = input.creatorId ? UserId.create(input.creatorId) : null;

  const sourceTypes = (input.sourceTypes ?? []) as SourceType[];

  const filters = SearchFilter.create({
    sourceTypes,
    dateRange,
    creatorId,
  });

  // SearchQuery.create validates keyword, offset, limit, and sourceType availability for SPACE scope
  const query = SearchQuery.create({
    keyword: input.keyword,
    scope,
    filters,
    offset: input.offset,
    limit: input.limit,
  });

  try {
    const result = await container.searchIndexProvider.search(query);

    return {
      items: result.items.map((item) => ({
        title: item.title,
        snippet: item.snippet,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        locationName: item.locationName,
        creatorName: item.creatorName,
        createdAt: item.createdAt,
      })),
      totalCount: result.totalCount,
      offset: result.offset,
      limit: result.limit,
    };
  } catch (error) {
    if (
      error instanceof SystemError ||
      (error instanceof Error && error.name === "BusinessRuleError")
    ) {
      throw error;
    }
    throw new SystemError(
      SystemErrorCode.ExternalApiError,
      "Search execution failed",
      error,
    );
  }
}
