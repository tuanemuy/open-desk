/**
 * Error codes for the Notification domain.
 */
export const NotificationErrorCode = {
  // Notification errors
  EmptyNotificationTitle: "NOTIFICATION_EMPTY_TITLE",
  TitleTooLong: "NOTIFICATION_TITLE_TOO_LONG",
  ContentTooLong: "NOTIFICATION_CONTENT_TOO_LONG",
  InvalidNotificationType: "NOTIFICATION_INVALID_TYPE",
  InvalidSourceType: "NOTIFICATION_INVALID_SOURCE_TYPE",

  // NotificationFilter errors
  EmptyFilterName: "NOTIFICATION_EMPTY_FILTER_NAME",
  FilterNameTooLong: "NOTIFICATION_FILTER_NAME_TOO_LONG",
  InvalidFilterNotificationType:
    "NOTIFICATION_INVALID_FILTER_NOTIFICATION_TYPE",
  InvalidLocationFilterMode: "NOTIFICATION_INVALID_LOCATION_FILTER_MODE",
  InvalidLocationType: "NOTIFICATION_INVALID_LOCATION_TYPE",
  InvalidSenderFilterType: "NOTIFICATION_INVALID_SENDER_FILTER_TYPE",
  EmptyLocationConditions: "NOTIFICATION_EMPTY_LOCATION_CONDITIONS",
  CannotModifyBuiltInFilter: "NOTIFICATION_CANNOT_MODIFY_BUILT_IN_FILTER",

  // NotificationPreference errors
  InvalidEmailNotificationScope:
    "NOTIFICATION_INVALID_EMAIL_NOTIFICATION_SCOPE",
  InvalidEmailNotificationFormat:
    "NOTIFICATION_INVALID_EMAIL_NOTIFICATION_FORMAT",
  EmailNotEnabled: "NOTIFICATION_EMAIL_NOT_ENABLED",
} as const;

export type NotificationErrorCode =
  (typeof NotificationErrorCode)[keyof typeof NotificationErrorCode];
