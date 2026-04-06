import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { NotificationErrorCode } from "./errorCode";

// ============================================
// NotificationId
// ============================================

type _NotificationId = string & { readonly brand: "NotificationId" };

export type NotificationId = _NotificationId;

export const NotificationId = {
  create: (id: string): _NotificationId => {
    return id as _NotificationId;
  },
  generate: (): _NotificationId => {
    return uuidv7() as _NotificationId;
  },
};

// ============================================
// NotificationFilterId
// ============================================

type _NotificationFilterId = string & {
  readonly brand: "NotificationFilterId";
};

export type NotificationFilterId = _NotificationFilterId;

export const NotificationFilterId = {
  create: (id: string): _NotificationFilterId => {
    return id as _NotificationFilterId;
  },
  generate: (): _NotificationFilterId => {
    return uuidv7() as _NotificationFilterId;
  },
};

// ============================================
// NotificationType
// ============================================

const NOTIFICATION_TYPES = [
  "MENTION",
  "APP_CONDITION",
  "RECORD_CONDITION",
  "REMINDER",
  "SPACE",
] as const;

type _NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationType = _NotificationType;

export const NotificationType = {
  create: (value: string): _NotificationType => {
    if (!NOTIFICATION_TYPES.includes(value as _NotificationType)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidNotificationType,
        `Invalid notification type: ${value}`,
      );
    }
    return value as _NotificationType;
  },
  validValues: NOTIFICATION_TYPES,
};

// ============================================
// SourceType
// ============================================

const SOURCE_TYPES = ["RECORD", "COMMENT", "THREAD"] as const;

type _SourceType = (typeof SOURCE_TYPES)[number];

export type SourceType = _SourceType;

export const SourceType = {
  create: (value: string): _SourceType => {
    if (!SOURCE_TYPES.includes(value as _SourceType)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidSourceType,
        `Invalid source type: ${value}`,
      );
    }
    return value as _SourceType;
  },
  validValues: SOURCE_TYPES,
};

// ============================================
// LocationType
// ============================================

const LOCATION_TYPES = ["APP", "SPACE", "PEOPLE", "MESSAGE"] as const;

type _LocationType = (typeof LOCATION_TYPES)[number];

export type LocationType = _LocationType;

export const LocationType = {
  create: (value: string): _LocationType => {
    if (!LOCATION_TYPES.includes(value as _LocationType)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidLocationType,
        `Invalid location type: ${value}`,
      );
    }
    return value as _LocationType;
  },
  validValues: LOCATION_TYPES,
};

// ============================================
// SenderFilterType
// ============================================

const SENDER_FILTER_TYPES = ["USER", "ORGANIZATION", "GROUP"] as const;

type _SenderFilterType = (typeof SENDER_FILTER_TYPES)[number];

export type SenderFilterType = _SenderFilterType;

export const SenderFilterType = {
  create: (value: string): _SenderFilterType => {
    if (!SENDER_FILTER_TYPES.includes(value as _SenderFilterType)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidSenderFilterType,
        `Invalid sender filter type: ${value}`,
      );
    }
    return value as _SenderFilterType;
  },
  validValues: SENDER_FILTER_TYPES,
};

// ============================================
// FilterNotificationType
// ============================================

const FILTER_NOTIFICATION_TYPES = ["ALL", "MENTION"] as const;

type _FilterNotificationType = (typeof FILTER_NOTIFICATION_TYPES)[number];

export type FilterNotificationType = _FilterNotificationType;

export const FilterNotificationType = {
  create: (value: string): _FilterNotificationType => {
    if (!FILTER_NOTIFICATION_TYPES.includes(value as _FilterNotificationType)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidFilterNotificationType,
        `Invalid filter notification type: ${value}`,
      );
    }
    return value as _FilterNotificationType;
  },
  validValues: FILTER_NOTIFICATION_TYPES,
};

// ============================================
// LocationFilterMode
// ============================================

const LOCATION_FILTER_MODES = ["ALL", "INCLUDE", "EXCLUDE"] as const;

type _LocationFilterMode = (typeof LOCATION_FILTER_MODES)[number];

export type LocationFilterMode = _LocationFilterMode;

export const LocationFilterMode = {
  create: (value: string): _LocationFilterMode => {
    if (!LOCATION_FILTER_MODES.includes(value as _LocationFilterMode)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidLocationFilterMode,
        `Invalid location filter mode: ${value}`,
      );
    }
    return value as _LocationFilterMode;
  },
  validValues: LOCATION_FILTER_MODES,
};

// ============================================
// EmailNotificationScope
// ============================================

const EMAIL_NOTIFICATION_SCOPES = ["MENTION_ONLY", "ALL"] as const;

type _EmailNotificationScope = (typeof EMAIL_NOTIFICATION_SCOPES)[number];

export type EmailNotificationScope = _EmailNotificationScope;

export const EmailNotificationScope = {
  create: (value: string): _EmailNotificationScope => {
    if (!EMAIL_NOTIFICATION_SCOPES.includes(value as _EmailNotificationScope)) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidEmailNotificationScope,
        `Invalid email notification scope: ${value}`,
      );
    }
    return value as _EmailNotificationScope;
  },
  validValues: EMAIL_NOTIFICATION_SCOPES,
};

// ============================================
// EmailNotificationFormat
// ============================================

const EMAIL_NOTIFICATION_FORMATS = ["HTML", "TEXT"] as const;

type _EmailNotificationFormat = (typeof EMAIL_NOTIFICATION_FORMATS)[number];

export type EmailNotificationFormat = _EmailNotificationFormat;

export const EmailNotificationFormat = {
  create: (value: string): _EmailNotificationFormat => {
    if (
      !EMAIL_NOTIFICATION_FORMATS.includes(value as _EmailNotificationFormat)
    ) {
      throw new BusinessRuleError(
        NotificationErrorCode.InvalidEmailNotificationFormat,
        `Invalid email notification format: ${value}`,
      );
    }
    return value as _EmailNotificationFormat;
  },
  validValues: EMAIL_NOTIFICATION_FORMATS,
};

// ============================================
// BuiltInFilterType
// ============================================

const BUILT_IN_FILTER_TYPES = ["MENTION", "READ_LATER", "ALL"] as const;

type _BuiltInFilterType = (typeof BUILT_IN_FILTER_TYPES)[number];

export type BuiltInFilterType = _BuiltInFilterType;

export const BuiltInFilterType = {
  validValues: BUILT_IN_FILTER_TYPES,
};

// ============================================
// NotificationTitle
// ============================================

const NOTIFICATION_TITLE_MAX_LENGTH = 256;

type _NotificationTitle = string & { readonly brand: "NotificationTitle" };

export type NotificationTitle = _NotificationTitle;

export const NotificationTitle = {
  create: (value: string): _NotificationTitle => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        NotificationErrorCode.EmptyNotificationTitle,
        "Notification title cannot be empty",
      );
    }
    if (value.length > NOTIFICATION_TITLE_MAX_LENGTH) {
      throw new BusinessRuleError(
        NotificationErrorCode.TitleTooLong,
        `Notification title exceeds maximum length of ${NOTIFICATION_TITLE_MAX_LENGTH} characters`,
      );
    }
    return value as _NotificationTitle;
  },
  maxLength: NOTIFICATION_TITLE_MAX_LENGTH,
};

// ============================================
// NotificationContent
// ============================================

const NOTIFICATION_CONTENT_MAX_LENGTH = 1024;

type _NotificationContent = string & {
  readonly brand: "NotificationContent";
};

export type NotificationContent = _NotificationContent;

export const NotificationContent = {
  create: (value: string): _NotificationContent => {
    if (value.length > NOTIFICATION_CONTENT_MAX_LENGTH) {
      throw new BusinessRuleError(
        NotificationErrorCode.ContentTooLong,
        `Notification content exceeds maximum length of ${NOTIFICATION_CONTENT_MAX_LENGTH} characters`,
      );
    }
    return value as _NotificationContent;
  },
  maxLength: NOTIFICATION_CONTENT_MAX_LENGTH,
};

// ============================================
// FilterName
// ============================================

const FILTER_NAME_MAX_LENGTH = 100;

type _FilterName = string & { readonly brand: "FilterName" };

export type FilterName = _FilterName;

export const FilterName = {
  create: (value: string): _FilterName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        NotificationErrorCode.EmptyFilterName,
        "Filter name cannot be empty",
      );
    }
    if (value.length > FILTER_NAME_MAX_LENGTH) {
      throw new BusinessRuleError(
        NotificationErrorCode.FilterNameTooLong,
        `Filter name exceeds maximum length of ${FILTER_NAME_MAX_LENGTH} characters`,
      );
    }
    return value as _FilterName;
  },
  maxLength: FILTER_NAME_MAX_LENGTH,
};

// ============================================
// LocationCondition
// ============================================

type _LocationCondition = Readonly<{
  locationType: _LocationType;
  locationId: string | null;
}>;

export type LocationCondition = _LocationCondition;

export const LocationCondition = {
  create: (params: {
    locationType: _LocationType;
    locationId: string | null;
  }): _LocationCondition => ({
    locationType: params.locationType,
    locationId: params.locationId,
  }),
  equals: (a: _LocationCondition, b: _LocationCondition): boolean =>
    a.locationType === b.locationType && a.locationId === b.locationId,
};

// ============================================
// SenderCondition
// ============================================

type _SenderCondition = Readonly<{
  senderType: _SenderFilterType;
  senderId: string;
}>;

export type SenderCondition = _SenderCondition;

export const SenderCondition = {
  create: (params: {
    senderType: _SenderFilterType;
    senderId: string;
  }): _SenderCondition => ({
    senderType: params.senderType,
    senderId: params.senderId,
  }),
  equals: (a: _SenderCondition, b: _SenderCondition): boolean =>
    a.senderType === b.senderType && a.senderId === b.senderId,
};

// ============================================
// NotificationSource (used for filter matching)
// ============================================

type _NotificationSource = Readonly<{
  appId: string | null;
  spaceId: string | null;
  locationType: _LocationType;
}>;

export type NotificationSource = _NotificationSource;

export const NotificationSource = {
  create: (params: {
    appId: string | null;
    spaceId: string | null;
    locationType: _LocationType;
  }): _NotificationSource => ({
    appId: params.appId,
    spaceId: params.spaceId,
    locationType: params.locationType,
  }),
};
