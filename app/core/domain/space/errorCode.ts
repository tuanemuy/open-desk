/**
 * Error codes for the Space domain.
 */
export const SpaceErrorCode = {
  // Space errors
  EmptySpaceName: "SPACE_EMPTY_SPACE_NAME",
  SpaceNameTooLong: "SPACE_SPACE_NAME_TOO_LONG",
  MultiThreadIrreversible: "SPACE_MULTI_THREAD_IRREVERSIBLE",
  GuestSpacePrivacy: "SPACE_GUEST_SPACE_PRIVACY",

  // Thread errors
  EmptyThreadTitle: "SPACE_EMPTY_THREAD_TITLE",
  ThreadTitleTooLong: "SPACE_THREAD_TITLE_TOO_LONG",
  ThreadBodyTooLong: "SPACE_THREAD_BODY_TOO_LONG",

  // Comment errors
  EmptyComment: "SPACE_EMPTY_COMMENT",
  CommentTextTooLong: "SPACE_COMMENT_TEXT_TOO_LONG",
  TooManyMentions: "SPACE_TOO_MANY_MENTIONS",
  TooManyFiles: "SPACE_TOO_MANY_FILES",
  EmptyMentionCode: "SPACE_EMPTY_MENTION_CODE",

  // Cover image errors
  InvalidCoverImage: "SPACE_INVALID_COVER_IMAGE",

  // Member errors
  IncludeSubsNotOrganization: "SPACE_INCLUDE_SUBS_NOT_ORGANIZATION",
  EmptyMemberEntityCode: "SPACE_EMPTY_MEMBER_ENTITY_CODE",

  // Announcement errors
  AnnouncementBodyTooLong: "SPACE_ANNOUNCEMENT_BODY_TOO_LONG",

  // Related link errors
  EmptyRelatedLinkTitle: "SPACE_EMPTY_RELATED_LINK_TITLE",
  EmptyRelatedLinkUrl: "SPACE_EMPTY_RELATED_LINK_URL",
  InvalidRelatedLinkUrl: "SPACE_INVALID_RELATED_LINK_URL",

  // Template errors
  EmptyTemplateName: "SPACE_EMPTY_TEMPLATE_NAME",

  // CommentFile errors
  InvalidCommentFileWidth: "SPACE_INVALID_COMMENT_FILE_WIDTH",

  // ThreadAction errors
  EmptyThreadActionName: "SPACE_EMPTY_THREAD_ACTION_NAME",
  ThreadActionNameTooLong: "SPACE_THREAD_ACTION_NAME_TOO_LONG",
  EmptyFieldMappings: "SPACE_EMPTY_FIELD_MAPPINGS",
  TooManyFieldMappings: "SPACE_TOO_MANY_FIELD_MAPPINGS",
  EmptyDestinationFieldCode: "SPACE_EMPTY_DESTINATION_FIELD_CODE",
  InvalidThreadCommentField: "SPACE_INVALID_THREAD_COMMENT_FIELD",
} as const;

export type SpaceErrorCode =
  (typeof SpaceErrorCode)[keyof typeof SpaceErrorCode];
