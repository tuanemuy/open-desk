import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import { MessageErrorCode } from "./errorCode";
import type { DirectMessageEvent, MessageThreadEvent } from "./events";
import { MessageEvents } from "./events";
import type {
  DirectMessageId as DirectMessageIdType,
  FileKey as FileKeyType,
  MessageThreadId as MessageThreadIdType,
  RichTextHtml as RichTextHtmlType,
} from "./valueObject";
import { DirectMessageId, MessageThreadId } from "./valueObject";

// ============================================
// MessageThread Entity
// ============================================

type _MessageThread = Readonly<{
  threadId: MessageThreadIdType;
  participantIds: readonly [UserIdType, UserIdType];
  lastMessageAt: Date | null;
  createdAt: Date;
}>;

export type MessageThread = _MessageThread;

/**
 * Sort two UserIds lexicographically to ensure consistent ordering.
 * This guarantees that the same pair of users always produces the same tuple order.
 */
function sortParticipantIds(
  id1: UserIdType,
  id2: UserIdType,
): readonly [UserIdType, UserIdType] {
  return id1 <= id2 ? [id1, id2] : [id2, id1];
}

export const MessageThread = {
  /**
   * Create a new MessageThread entity.
   * The participantIds are automatically sorted (lexicographic ascending) to ensure
   * uniqueness of the pair regardless of argument order.
   *
   * @throws BusinessRuleError if both participant IDs are the same
   */
  create: (params: {
    participantId1: UserIdType;
    participantId2: UserIdType;
  }): WithEvents<_MessageThread, MessageThreadEvent> => {
    if (params.participantId1 === params.participantId2) {
      throw new BusinessRuleError(
        MessageErrorCode.SameParticipant,
        "Cannot create a message thread with the same user as both participants",
      );
    }

    const participantIds = sortParticipantIds(
      params.participantId1,
      params.participantId2,
    );
    const now = new Date();
    const thread: _MessageThread = {
      threadId: MessageThreadId.generate(),
      participantIds,
      lastMessageAt: null,
      createdAt: now,
    };

    return {
      entity: thread,
      events: [
        MessageEvents.threadCreated(thread.threadId, thread.participantIds),
      ],
    };
  },

  /**
   * Reconstruct a MessageThread entity from persisted data.
   * The participantIds are sorted to guarantee the invariant even when loading from DB.
   */
  reconstruct: (data: _MessageThread): _MessageThread => ({
    ...data,
    participantIds: sortParticipantIds(
      data.participantIds[0],
      data.participantIds[1],
    ),
  }),

  /**
   * Update the last message timestamp.
   * Called when a new message is sent in this thread.
   */
  updateLastMessageAt: (
    thread: _MessageThread,
    messageAt: Date,
  ): WithEvents<_MessageThread, MessageThreadEvent> => {
    return {
      entity: {
        ...thread,
        lastMessageAt: messageAt,
      },
      events: [],
    };
  },

  /**
   * Check whether the given user is a participant of this thread.
   */
  isParticipant: (thread: _MessageThread, userId: UserIdType): boolean => {
    return (
      thread.participantIds[0] === userId || thread.participantIds[1] === userId
    );
  },

  /**
   * Get the counterpart user ID in this thread.
   *
   * @throws BusinessRuleError if the given user is not a participant
   */
  getCounterpartId: (
    thread: _MessageThread,
    myUserId: UserIdType,
  ): UserIdType => {
    if (thread.participantIds[0] === myUserId) {
      return thread.participantIds[1];
    }
    if (thread.participantIds[1] === myUserId) {
      return thread.participantIds[0];
    }
    throw new BusinessRuleError(
      MessageErrorCode.NotParticipant,
      `User ${myUserId} is not a participant of thread ${thread.threadId}`,
    );
  },
};

// ============================================
// DirectMessage Entity
// ============================================

type _DirectMessage = Readonly<{
  messageId: DirectMessageIdType;
  threadId: MessageThreadIdType;
  senderId: UserIdType;
  content: RichTextHtmlType;
  attachmentFileKeys: readonly FileKeyType[];
  createdAt: Date;
}>;

export type DirectMessage = _DirectMessage;

export const DirectMessage = {
  /**
   * Create a new DirectMessage entity.
   * The content must not be empty.
   * The sender must be a participant of the thread (validated by caller with the thread entity).
   *
   * @throws BusinessRuleError if content is empty
   */
  create: (params: {
    threadId: MessageThreadIdType;
    senderId: UserIdType;
    content: RichTextHtmlType;
    attachmentFileKeys: readonly FileKeyType[];
  }): WithEvents<_DirectMessage, DirectMessageEvent> => {
    if ((params.content as string).length === 0) {
      throw new BusinessRuleError(
        MessageErrorCode.EmptyMessageContent,
        "Message content cannot be empty",
      );
    }

    const now = new Date();
    const message: _DirectMessage = {
      messageId: DirectMessageId.generate(),
      threadId: params.threadId,
      senderId: params.senderId,
      content: params.content,
      attachmentFileKeys: params.attachmentFileKeys,
      createdAt: now,
    };

    return {
      entity: message,
      events: [
        MessageEvents.directMessageSent(
          message.messageId,
          message.threadId,
          message.senderId,
        ),
      ],
    };
  },

  /**
   * Reconstruct a DirectMessage entity from persisted data.
   */
  reconstruct: (data: _DirectMessage): _DirectMessage => data,

  /**
   * Check whether the message was sent by the given user.
   */
  isSentBy: (message: _DirectMessage, userId: UserIdType): boolean => {
    return message.senderId === userId;
  },
};
