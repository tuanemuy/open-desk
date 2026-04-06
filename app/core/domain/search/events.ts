import type { DomainEventBase } from "@/core/domain/common/event";
import type { SourceType as SourceTypeValue } from "./valueObject";

// ============================================
// Search Index Events
// ============================================

export type IndexEntryUpsertedEvent = DomainEventBase<
  "search.index.upserted",
  { sourceType: SourceTypeValue; sourceId: string }
>;

export type IndexEntryRemovedEvent = DomainEventBase<
  "search.index.removed",
  { sourceType: SourceTypeValue; sourceId: string }
>;

// ============================================
// Union Types
// ============================================

export type SearchEvent = IndexEntryUpsertedEvent | IndexEntryRemovedEvent;

// ============================================
// Event Factories
// ============================================

export const SearchEvents = {
  indexEntryUpserted: (
    sourceType: SourceTypeValue,
    sourceId: string,
  ): IndexEntryUpsertedEvent => ({
    type: "search.index.upserted",
    payload: { sourceType, sourceId },
    occurredAt: new Date(),
  }),

  indexEntryRemoved: (
    sourceType: SourceTypeValue,
    sourceId: string,
  ): IndexEntryRemovedEvent => ({
    type: "search.index.removed",
    payload: { sourceType, sourceId },
    occurredAt: new Date(),
  }),
};
