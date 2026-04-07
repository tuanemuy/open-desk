import { asc, eq, isNull } from "drizzle-orm";
import { eventOutbox } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { DomainEvent } from "@/core/domain/common/event";
import type {
  OutboxEntry,
  OutboxRepository,
} from "@/core/domain/common/ports/outboxRepository";
import type { Executor } from "../client";

export class DrizzleSqliteOutboxRepository implements OutboxRepository {
  constructor(private readonly executor: Executor) {}

  async saveEvents(events: readonly DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      const values = events.map((event) => ({
        id: crypto.randomUUID(),
        eventType: event.type,
        eventPayload: JSON.stringify(event.payload),
        occurredAt: event.occurredAt,
      }));

      await this.executor.insert(eventOutbox).values(values);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save outbox events",
        error,
      );
    }
  }

  async findPendingEvents(limit: number): Promise<OutboxEntry[]> {
    try {
      const results = await this.executor
        .select()
        .from(eventOutbox)
        .where(isNull(eventOutbox.processedAt))
        .orderBy(asc(eventOutbox.createdAt))
        .limit(limit);

      return results.map((row) => ({
        id: row.id,
        event: {
          type: row.eventType,
          payload: JSON.parse(row.eventPayload) as unknown,
          occurredAt: row.occurredAt,
        },
        createdAt: row.createdAt,
        processedAt: row.processedAt,
      }));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find pending outbox events",
        error,
      );
    }
  }

  async markAsProcessed(id: string): Promise<void> {
    try {
      await this.executor
        .update(eventOutbox)
        .set({ processedAt: new Date() })
        .where(eq(eventOutbox.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to mark outbox event as processed",
        error,
      );
    }
  }
}
