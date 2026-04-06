/**
 * Error codes for the Message domain.
 */
export const MessageErrorCode = {
  // MessageThread errors
  SameParticipant: "MESSAGE_SAME_PARTICIPANT",
  NotParticipant: "MESSAGE_NOT_PARTICIPANT",

  // DirectMessage errors
  EmptyMessageContent: "MESSAGE_EMPTY_CONTENT",
  SenderNotParticipant: "MESSAGE_SENDER_NOT_PARTICIPANT",

  // RichTextHtml errors
  InvalidRichTextHtml: "MESSAGE_INVALID_RICH_TEXT_HTML",

  // Value object errors
  EmptyFileKey: "MESSAGE_EMPTY_FILE_KEY",
} as const;

export type MessageErrorCode =
  (typeof MessageErrorCode)[keyof typeof MessageErrorCode];
