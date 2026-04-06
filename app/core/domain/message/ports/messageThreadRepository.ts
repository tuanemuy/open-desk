import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { MessageThread } from "@/core/domain/message/entity";
import type { MessageThreadId as MessageThreadIdType } from "@/core/domain/message/valueObject";

/**
 * Paginated result for message thread listings.
 */
export type MessageThreadListResult = {
  readonly threads: readonly MessageThread[];
  readonly totalCount: number;
};

/**
 * Repository port for MessageThread entity persistence.
 */
export interface MessageThreadRepository {
  /**
   * Find a message thread by its unique identifier.
   * @returns The message thread, or null if not found
   */
  findById(threadId: MessageThreadIdType): Promise<MessageThread | null>;

  /**
   * Find a message thread by the pair of participant user IDs.
   * The order of the arguments does not matter; IDs are sorted internally.
   * @returns The message thread, or null if not found
   */
  findByParticipantIds(
    participantId1: UserIdType,
    participantId2: UserIdType,
  ): Promise<MessageThread | null>;

  /**
   * List message threads in which the given user participates,
   * ordered by lastMessageAt descending (most recent first).
   */
  findByParticipantUserId(params: {
    userId: UserIdType;
    offset: number;
    limit: number;
  }): Promise<MessageThreadListResult>;

  /**
   * Save a message thread (insert or update).
   * Implementations must enforce the uniqueness constraint on participantIds.
   */
  save(thread: MessageThread): Promise<void>;
}
