import type { DomainResult } from "@/core/domain/common/result";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { MessageThread as MessageThreadType } from "../entity";
import { MessageThread } from "../entity";
import type { MessageThreadRepository } from "../ports/messageThreadRepository";

// ============================================
// Error Types
// ============================================

export type SameParticipantError = {
  readonly kind: "SameParticipant";
};

export type GetOrCreateThreadError = SameParticipantError;

// ============================================
// Service Dependencies
// ============================================

export type MessageThreadServiceDeps = {
  readonly messageThreadRepository: MessageThreadRepository;
};

// ============================================
// MessageThread Service
// ============================================

/**
 * Get or create a message thread for two participants.
 *
 * 1. Validates that the two user IDs are different
 * 2. Searches for an existing thread by participant IDs
 * 3. If found, returns it
 * 4. If not found, creates a new thread, saves it, and returns it
 */
export async function getOrCreateThread(
  deps: MessageThreadServiceDeps,
  participantId1: UserIdType,
  participantId2: UserIdType,
): Promise<DomainResult<MessageThreadType, GetOrCreateThreadError>> {
  if (participantId1 === participantId2) {
    return { ok: false, error: { kind: "SameParticipant" } };
  }

  const existing = await deps.messageThreadRepository.findByParticipantIds(
    participantId1,
    participantId2,
  );

  if (existing) {
    return { ok: true, value: existing };
  }

  const { entity: thread } = MessageThread.create({
    participantId1,
    participantId2,
  });

  await deps.messageThreadRepository.save(thread);

  return { ok: true, value: thread };
}
