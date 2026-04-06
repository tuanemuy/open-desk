import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import { NotificationErrorCode } from "./errorCode";
import type { NotificationEvent, NotificationFilterEvent } from "./events";
import { NotificationEvents } from "./events";
import type {
  EmailNotificationFormat as EmailNotificationFormatType,
  EmailNotificationScope as EmailNotificationScopeType,
  FilterName as FilterNameType,
  FilterNotificationType as FilterNotificationTypeType,
  LocationCondition as LocationConditionType,
  LocationFilterMode as LocationFilterModeType,
  NotificationContent as NotificationContentType,
  NotificationFilterId as NotificationFilterIdType,
  NotificationId as NotificationIdType,
  NotificationTitle as NotificationTitleType,
  NotificationType as NotificationTypeType,
  SenderCondition as SenderConditionType,
  SourceType as SourceTypeType,
} from "./valueObject";
import {
  FilterName,
  NotificationContent,
  NotificationFilterId,
  NotificationId,
  NotificationTitle,
} from "./valueObject";

// ============================================
// Notification Entity
// ============================================

type _Notification = Readonly<{
  notificationId: NotificationIdType;
  recipientId: UserIdType;
  type: NotificationTypeType;
  sourceType: SourceTypeType;
  sourceId: string;
  senderId: UserIdType | null;
  title: NotificationTitleType;
  content: NotificationContentType;
  isRead: boolean;
  isReadLater: boolean;
  createdAt: Date;
}>;

export type Notification = _Notification;

export const Notification = {
  /**
   * Create a new Notification entity.
   * isRead defaults to false, isReadLater defaults to false.
   */
  create: (params: {
    recipientId: UserIdType;
    type: NotificationTypeType;
    sourceType: SourceTypeType;
    sourceId: string;
    senderId: UserIdType | null;
    title: string;
    content: string;
  }): WithEvents<_Notification, NotificationEvent> => {
    const notification: _Notification = {
      notificationId: NotificationId.generate(),
      recipientId: params.recipientId,
      type: params.type,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      senderId: params.senderId,
      title: NotificationTitle.create(params.title),
      content: NotificationContent.create(params.content),
      isRead: false,
      isReadLater: false,
      createdAt: new Date(),
    };

    return {
      entity: notification,
      events: [
        NotificationEvents.created(
          notification.notificationId,
          notification.recipientId,
        ),
      ],
    };
  },

  /**
   * Reconstruct a Notification entity from persisted data.
   */
  reconstruct: (data: _Notification): _Notification => data,

  /**
   * Mark the notification as read.
   * Idempotent: if already read, returns unchanged with no events.
   */
  markAsRead: (
    notification: _Notification,
  ): WithEvents<_Notification, NotificationEvent> => {
    if (notification.isRead) {
      return { entity: notification, events: [] };
    }
    return {
      entity: {
        ...notification,
        isRead: true,
      },
      events: [
        NotificationEvents.read(
          notification.notificationId,
          notification.recipientId,
        ),
      ],
    };
  },

  /**
   * Mark the notification as unread.
   * Idempotent: if already unread, returns unchanged with no events.
   */
  markAsUnread: (
    notification: _Notification,
  ): WithEvents<_Notification, NotificationEvent> => {
    if (!notification.isRead) {
      return { entity: notification, events: [] };
    }
    return {
      entity: {
        ...notification,
        isRead: false,
      },
      events: [
        NotificationEvents.unread(
          notification.notificationId,
          notification.recipientId,
        ),
      ],
    };
  },

  /**
   * Toggle the "read later" flag.
   */
  toggleReadLater: (
    notification: _Notification,
  ): WithEvents<_Notification, NotificationEvent> => {
    const newIsReadLater = !notification.isReadLater;
    return {
      entity: {
        ...notification,
        isReadLater: newIsReadLater,
      },
      events: [
        NotificationEvents.readLaterToggled(
          notification.notificationId,
          notification.recipientId,
          newIsReadLater,
        ),
      ],
    };
  },

  /**
   * Check if the specified user is the recipient of this notification.
   */
  isOwnedBy: (notification: _Notification, userId: UserIdType): boolean =>
    notification.recipientId === userId,
};

// ============================================
// NotificationFilter Entity
// ============================================

type _NotificationFilter = Readonly<{
  filterId: NotificationFilterIdType;
  userId: UserIdType;
  isBuiltIn: boolean;
  name: FilterNameType;
  notificationType: FilterNotificationTypeType;
  locationMode: LocationFilterModeType;
  locationConditions: readonly LocationConditionType[];
  senderConditions: readonly SenderConditionType[];
  createdAt: Date;
  updatedAt: Date;
}>;

export type NotificationFilter = _NotificationFilter;

export const NotificationFilter = {
  /**
   * Create a new custom NotificationFilter entity.
   * Validates that locationConditions are consistent with locationMode.
   */
  create: (params: {
    userId: UserIdType;
    name: string;
    notificationType: FilterNotificationTypeType;
    locationMode: LocationFilterModeType;
    locationConditions: readonly LocationConditionType[];
    senderConditions: readonly SenderConditionType[];
  }): WithEvents<_NotificationFilter, NotificationFilterEvent> => {
    validateLocationConditions(params.locationMode, params.locationConditions);

    const now = new Date();
    const filter: _NotificationFilter = {
      filterId: NotificationFilterId.generate(),
      userId: params.userId,
      isBuiltIn: false,
      name: FilterName.create(params.name),
      notificationType: params.notificationType,
      locationMode: params.locationMode,
      locationConditions:
        params.locationMode === "ALL" ? [] : params.locationConditions,
      senderConditions: params.senderConditions,
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: filter,
      events: [
        NotificationEvents.filterCreated(filter.filterId, filter.userId),
      ],
    };
  },

  /**
   * Create a built-in NotificationFilter entity.
   * Built-in filters cannot be edited or deleted.
   */
  createBuiltIn: (params: {
    userId: UserIdType;
    name: string;
    notificationType: FilterNotificationTypeType;
  }): WithEvents<_NotificationFilter, NotificationFilterEvent> => {
    const now = new Date();
    const filter: _NotificationFilter = {
      filterId: NotificationFilterId.generate(),
      userId: params.userId,
      isBuiltIn: true,
      name: FilterName.create(params.name),
      notificationType: params.notificationType,
      locationMode: "ALL",
      locationConditions: [],
      senderConditions: [],
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: filter,
      events: [
        NotificationEvents.filterCreated(filter.filterId, filter.userId),
      ],
    };
  },

  /**
   * Reconstruct a NotificationFilter entity from persisted data.
   */
  reconstruct: (data: _NotificationFilter): _NotificationFilter => data,

  /**
   * Rename the filter.
   * Throws if the filter is built-in.
   */
  rename: (
    filter: _NotificationFilter,
    name: string,
  ): WithEvents<_NotificationFilter, NotificationFilterEvent> => {
    assertNotBuiltIn(filter);
    return {
      entity: {
        ...filter,
        name: FilterName.create(name),
        updatedAt: new Date(),
      },
      events: [
        NotificationEvents.filterUpdated(filter.filterId, filter.userId),
      ],
    };
  },

  /**
   * Change the notification type filter.
   * Throws if the filter is built-in.
   */
  changeNotificationType: (
    filter: _NotificationFilter,
    notificationType: FilterNotificationTypeType,
  ): WithEvents<_NotificationFilter, NotificationFilterEvent> => {
    assertNotBuiltIn(filter);
    return {
      entity: {
        ...filter,
        notificationType,
        updatedAt: new Date(),
      },
      events: [
        NotificationEvents.filterUpdated(filter.filterId, filter.userId),
      ],
    };
  },

  /**
   * Update location conditions.
   * Throws if the filter is built-in.
   * When mode is ALL, locationConditions are cleared.
   * When mode is INCLUDE or EXCLUDE, at least one condition is required.
   */
  updateLocationConditions: (
    filter: _NotificationFilter,
    mode: LocationFilterModeType,
    conditions: readonly LocationConditionType[],
  ): WithEvents<_NotificationFilter, NotificationFilterEvent> => {
    assertNotBuiltIn(filter);
    validateLocationConditions(mode, conditions);
    return {
      entity: {
        ...filter,
        locationMode: mode,
        locationConditions: mode === "ALL" ? [] : conditions,
        updatedAt: new Date(),
      },
      events: [
        NotificationEvents.filterUpdated(filter.filterId, filter.userId),
      ],
    };
  },

  /**
   * Update sender conditions.
   * Throws if the filter is built-in.
   * Empty array means all senders are included.
   */
  updateSenderConditions: (
    filter: _NotificationFilter,
    conditions: readonly SenderConditionType[],
  ): WithEvents<_NotificationFilter, NotificationFilterEvent> => {
    assertNotBuiltIn(filter);
    return {
      entity: {
        ...filter,
        senderConditions: conditions,
        updatedAt: new Date(),
      },
      events: [
        NotificationEvents.filterUpdated(filter.filterId, filter.userId),
      ],
    };
  },

  /**
   * Check if the specified user owns this filter.
   */
  isOwnedBy: (filter: _NotificationFilter, userId: UserIdType): boolean =>
    filter.userId === userId,
};

// ============================================
// NotificationPreference Entity
// ============================================

type _NotificationPreference = Readonly<{
  userId: UserIdType;
  emailEnabled: boolean;
  emailScope: EmailNotificationScopeType;
  emailFormat: EmailNotificationFormatType;
  desktopEnabled: boolean;
  updatedAt: Date;
}>;

export type NotificationPreference = _NotificationPreference;

export const NotificationPreference = {
  /**
   * Create a NotificationPreference with default values.
   * emailEnabled=true, emailScope=MENTION_ONLY, emailFormat=HTML, desktopEnabled=false
   */
  createDefault: (userId: UserIdType): _NotificationPreference => ({
    userId,
    emailEnabled: true,
    emailScope: "MENTION_ONLY",
    emailFormat: "HTML",
    desktopEnabled: false,
    updatedAt: new Date(),
  }),

  /**
   * Reconstruct a NotificationPreference from persisted data.
   */
  reconstruct: (data: _NotificationPreference): _NotificationPreference => data,

  /**
   * Set email notification enabled/disabled.
   */
  setEmailEnabled: (
    preference: _NotificationPreference,
    enabled: boolean,
  ): _NotificationPreference => ({
    ...preference,
    emailEnabled: enabled,
    updatedAt: new Date(),
  }),

  /**
   * Set email notification scope.
   * Throws if email is not enabled.
   */
  setEmailScope: (
    preference: _NotificationPreference,
    scope: EmailNotificationScopeType,
  ): _NotificationPreference => {
    if (!preference.emailEnabled) {
      throw new BusinessRuleError(
        NotificationErrorCode.EmailNotEnabled,
        "Cannot change email scope when email notifications are disabled",
      );
    }
    return {
      ...preference,
      emailScope: scope,
      updatedAt: new Date(),
    };
  },

  /**
   * Set email notification format.
   * Throws if email is not enabled.
   */
  setEmailFormat: (
    preference: _NotificationPreference,
    format: EmailNotificationFormatType,
  ): _NotificationPreference => {
    if (!preference.emailEnabled) {
      throw new BusinessRuleError(
        NotificationErrorCode.EmailNotEnabled,
        "Cannot change email format when email notifications are disabled",
      );
    }
    return {
      ...preference,
      emailFormat: format,
      updatedAt: new Date(),
    };
  },

  /**
   * Set desktop notification enabled/disabled.
   */
  setDesktopEnabled: (
    preference: _NotificationPreference,
    enabled: boolean,
  ): _NotificationPreference => ({
    ...preference,
    desktopEnabled: enabled,
    updatedAt: new Date(),
  }),

  /**
   * Check if the specified user owns this preference.
   */
  isOwnedBy: (
    preference: _NotificationPreference,
    userId: UserIdType,
  ): boolean => preference.userId === userId,
};

// ============================================
// Internal helper functions
// ============================================

function assertNotBuiltIn(filter: _NotificationFilter): void {
  if (filter.isBuiltIn) {
    throw new BusinessRuleError(
      NotificationErrorCode.CannotModifyBuiltInFilter,
      "Built-in filters cannot be modified",
    );
  }
}

function validateLocationConditions(
  mode: LocationFilterModeType,
  conditions: readonly LocationConditionType[],
): void {
  if ((mode === "INCLUDE" || mode === "EXCLUDE") && conditions.length === 0) {
    throw new BusinessRuleError(
      NotificationErrorCode.EmptyLocationConditions,
      `Location conditions cannot be empty when location mode is ${mode}`,
    );
  }
}
