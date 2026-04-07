/**
 * Output DTOs for Message application services.
 */

// ============================================
// MessageThread DTOs
// ============================================

export type MessageThreadItemOutput = {
  threadId: string;
  participantIds: [string, string];
  lastMessageAt: Date | null;
  createdAt: Date;
};

export type GetOrCreateThreadOutput = MessageThreadItemOutput;

export type ListMessageThreadsOutput = {
  threads: MessageThreadItemOutput[];
  totalCount: number;
  offset: number;
  limit: number;
};

// ============================================
// DirectMessage DTOs
// ============================================

export type DirectMessageItemOutput = {
  messageId: string;
  threadId: string;
  senderId: string;
  content: string;
  attachmentFileKeys: string[];
  createdAt: Date;
};

export type SendMessageOutput = DirectMessageItemOutput;

export type ListMessagesOutput = {
  messages: DirectMessageItemOutput[];
  totalCount: number;
  offset: number;
  limit: number;
};
