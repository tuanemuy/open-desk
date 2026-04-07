/**
 * Output DTOs for Search application services.
 */

export type SearchResultItemOutput = {
  title: string;
  snippet: string;
  sourceType: string;
  sourceId: string;
  locationName: string;
  creatorName: string;
  createdAt: Date;
};

export type SearchOutput = {
  items: SearchResultItemOutput[];
  totalCount: number;
  offset: number;
  limit: number;
};
