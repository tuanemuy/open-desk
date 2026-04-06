import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { DirectMessage } from "@/core/domain/message/entity";
import type {
  DirectMessageId as DirectMessageIdType,
  MessageThreadId as MessageThreadIdType,
} from "@/core/domain/message/valueObject";

/**
 * Paginated result for direct message listings.
 */
export type DirectMessageListResult = {
  readonly messages: readonly DirectMessage[];
  readonly totalCount: number;
};

/**
 * Search parameters for direct messages.
 */
export type DirectMessageSearchParams = {
  readonly threadId?: MessageThreadIdType;
  readonly keyword: string;
  readonly senderId?: UserIdType;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
  readonly offset: number;
  readonly limit: number;
};

/**
 * Repository port for DirectMessage entity persistence.
 */
export interface DirectMessageRepository {
  /**
   * Find a direct message by its unique identifier.
   * @returns The direct message, or null if not found
   */
  findById(messageId: DirectMessageIdType): Promise<DirectMessage | null>;

  /**
   * List messages in a thread, ordered by createdAt descending (newest first),
   * with pagination.
   */
  findByThreadId(params: {
    threadId: MessageThreadIdType;
    offset: number;
    limit: number;
  }): Promise<DirectMessageListResult>;

  /**
   * Save a direct message (insert only; messages are immutable after creation).
   */
  save(message: DirectMessage): Promise<void>;

  /**
   * Search messages by keyword with optional filters.
   */
  search(params: DirectMessageSearchParams): Promise<DirectMessageListResult>;
}
