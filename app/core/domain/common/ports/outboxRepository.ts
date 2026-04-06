import type { DomainEvent } from "@/core/domain/common/event";

/**
 * Entry stored in the outbox table.
 */
export type OutboxEntry = {
  readonly id: string;
  readonly event: DomainEvent;
  readonly createdAt: Date;
  readonly processedAt: Date | null;
};

/**
 * Repository port for the outbox pattern.
 * Ensures domain events are persisted atomically with entity changes.
 */
export interface OutboxRepository {
  /**
   * Save domain events to the outbox within the current transaction.
   */
  saveEvents(events: readonly DomainEvent[]): Promise<void>;

  /**
   * Find pending (unprocessed) events, ordered by creation time.
   */
  findPendingEvents(limit: number): Promise<OutboxEntry[]>;

  /**
   * Mark an outbox entry as processed.
   */
  markAsProcessed(id: string): Promise<void>;
}
