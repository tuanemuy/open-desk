import type { OutboxRepository } from "@/core/domain/common/ports/outboxRepository";

export type EventRelayWorkerConfig = {
  batchSize: number;
};

/**
 * Process pending outbox events by fetching them and marking as processed.
 * In the future, this will dispatch events to registered handlers.
 */
export async function processOutboxEvents(
  outboxRepository: OutboxRepository,
  config: EventRelayWorkerConfig,
): Promise<{ processedCount: number }> {
  const pendingEvents = await outboxRepository.findPendingEvents(
    config.batchSize,
  );

  for (const entry of pendingEvents) {
    await outboxRepository.markAsProcessed(entry.id);
  }

  return { processedCount: pendingEvents.length };
}
