/**
 * Error codes for the People domain.
 */
export const PeopleErrorCode = {
  // Post errors
  EmptyPostContent: "PEOPLE_EMPTY_POST_CONTENT",
  InvalidMentionTargetId: "PEOPLE_INVALID_MENTION_TARGET_ID",
  InvalidMentionType: "PEOPLE_INVALID_MENTION_TYPE",

  // Follow errors
  SelfFollow: "PEOPLE_SELF_FOLLOW",

  // Value object errors
  EmptyFileKey: "PEOPLE_EMPTY_FILE_KEY",
} as const;

export type PeopleErrorCode =
  (typeof PeopleErrorCode)[keyof typeof PeopleErrorCode];
