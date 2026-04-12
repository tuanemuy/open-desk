import type {
  BuiltInFilterType,
  EmailNotificationFormat,
  EmailNotificationScope,
  FilterNotificationType,
  LocationCondition,
  LocationFilterMode,
  NotificationSource,
  NotificationType,
  SenderCondition,
  SourceType,
} from "@/core/domain/notification/valueObject";

export type NotificationDto = {
  readonly notificationId: string;
  readonly type: NotificationType;
  readonly sourceType: SourceType;
  readonly sourceId: string;
  readonly senderId: string | null;
  readonly title: string;
  readonly content: string;
  readonly isRead: boolean;
  readonly isReadLater: boolean;
  readonly createdAt: Date;
};

export type NotificationListOutput = {
  readonly notifications: readonly NotificationDto[];
  readonly totalCount: number;
};

export type NotificationDetailOutput = NotificationDto & {
  readonly source: NotificationSource | null;
};

export type NotificationStatusOutput = {
  readonly notificationId: string;
  readonly isRead: boolean;
};

export type NotificationReadLaterOutput = {
  readonly notificationId: string;
  readonly isReadLater: boolean;
};

export type BulkReadOutput = {
  readonly readCount: number;
};

export type UnreadCountOutput = {
  readonly unreadCount: number;
};

export type GeneratedNotificationDto = {
  readonly notificationId: string;
  readonly recipientId: string;
};

export type GenerateNotificationsOutput = {
  readonly notifications: readonly GeneratedNotificationDto[];
};

export type FilterDto = {
  readonly filterId: string;
  readonly name: string;
  readonly notificationType: FilterNotificationType;
  readonly locationMode: LocationFilterMode;
  readonly locationConditions: readonly LocationCondition[];
  readonly senderConditions: readonly SenderCondition[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type FilterListOutput = {
  readonly builtInFilters: readonly {
    readonly filterId: string;
    readonly name: string;
    readonly builtInType: BuiltInFilterType;
  }[];
  readonly customFilters: readonly {
    readonly filterId: string;
    readonly name: string;
    readonly notificationType: FilterNotificationType;
    readonly locationMode: LocationFilterMode;
    readonly createdAt: Date;
  }[];
};

export type PreferenceOutput = {
  readonly emailEnabled: boolean;
  readonly emailScope: EmailNotificationScope;
  readonly emailFormat: EmailNotificationFormat;
  readonly desktopEnabled: boolean;
};

export type EmailPreferenceOutput = {
  readonly emailEnabled: boolean;
  readonly emailScope: EmailNotificationScope;
  readonly emailFormat: EmailNotificationFormat;
  readonly updatedAt: Date;
};

export type DesktopPreferenceOutput = {
  readonly desktopEnabled: boolean;
  readonly updatedAt: Date;
};

export type DeleteExpiredNotificationsOutput = {
  readonly deletedCount: number;
};
