import type { DomainEventBase } from "@/core/domain/common/event";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type {
  DirectMessageId as DirectMessageIdType,
  MessageThreadId as MessageThreadIdType,
} from "./valueObject";

// ============================================
// MessageThread Events
// ============================================

export type MessageThreadCreatedEvent = DomainEventBase<
  "message.thread.created",
  {
    threadId: MessageThreadIdType;
    participantIds: readonly [UserIdType, UserIdType];
  }
>;

// ============================================
// DirectMessage Events
// ============================================

export type DirectMessageSentEvent = DomainEventBase<
  "message.directMessage.sent",
  {
    messageId: DirectMessageIdType;
    threadId: MessageThreadIdType;
    senderId: UserIdType;
  }
>;

// ============================================
// Union Types
// ============================================

export type MessageThreadEvent = MessageThreadCreatedEvent;

export type DirectMessageEvent = DirectMessageSentEvent;

export type MessageEvent = MessageThreadEvent | DirectMessageEvent;

// ============================================
// Event Factories
// ============================================

export const MessageEvents = {
  threadCreated: (
    threadId: MessageThreadIdType,
    participantIds: readonly [UserIdType, UserIdType],
  ): MessageThreadCreatedEvent => ({
    type: "message.thread.created",
    payload: { threadId, participantIds },
    occurredAt: new Date(),
  }),

  directMessageSent: (
    messageId: DirectMessageIdType,
    threadId: MessageThreadIdType,
    senderId: UserIdType,
  ): DirectMessageSentEvent => ({
    type: "message.directMessage.sent",
    payload: { messageId, threadId, senderId },
    occurredAt: new Date(),
  }),
};
