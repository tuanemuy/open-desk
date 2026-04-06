import type { DomainEventBase } from "@/core/domain/common/event";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type {
  NotificationFilterId as NotificationFilterIdType,
  NotificationId as NotificationIdType,
} from "./valueObject";

// ============================================
// Notification Events
// ============================================

export type NotificationCreatedEvent = DomainEventBase<
  "notification.created",
  { notificationId: NotificationIdType; recipientId: UserIdType }
>;

export type NotificationReadEvent = DomainEventBase<
  "notification.read",
  { notificationId: NotificationIdType; recipientId: UserIdType }
>;

export type NotificationUnreadEvent = DomainEventBase<
  "notification.unread",
  { notificationId: NotificationIdType; recipientId: UserIdType }
>;

export type NotificationReadLaterToggledEvent = DomainEventBase<
  "notification.readLaterToggled",
  {
    notificationId: NotificationIdType;
    recipientId: UserIdType;
    isReadLater: boolean;
  }
>;

// ============================================
// NotificationFilter Events
// ============================================

export type NotificationFilterCreatedEvent = DomainEventBase<
  "notification.filter.created",
  { filterId: NotificationFilterIdType; userId: UserIdType }
>;

export type NotificationFilterUpdatedEvent = DomainEventBase<
  "notification.filter.updated",
  { filterId: NotificationFilterIdType; userId: UserIdType }
>;

export type NotificationFilterDeletedEvent = DomainEventBase<
  "notification.filter.deleted",
  { filterId: NotificationFilterIdType; userId: UserIdType }
>;

// ============================================
// Union Types
// ============================================

export type NotificationEvent =
  | NotificationCreatedEvent
  | NotificationReadEvent
  | NotificationUnreadEvent
  | NotificationReadLaterToggledEvent;

export type NotificationFilterEvent =
  | NotificationFilterCreatedEvent
  | NotificationFilterUpdatedEvent
  | NotificationFilterDeletedEvent;

export type NotificationDomainEvent =
  | NotificationEvent
  | NotificationFilterEvent;

// ============================================
// Event Factories
// ============================================

export const NotificationEvents = {
  created: (
    notificationId: NotificationIdType,
    recipientId: UserIdType,
  ): NotificationCreatedEvent => ({
    type: "notification.created",
    payload: { notificationId, recipientId },
    occurredAt: new Date(),
  }),

  read: (
    notificationId: NotificationIdType,
    recipientId: UserIdType,
  ): NotificationReadEvent => ({
    type: "notification.read",
    payload: { notificationId, recipientId },
    occurredAt: new Date(),
  }),

  unread: (
    notificationId: NotificationIdType,
    recipientId: UserIdType,
  ): NotificationUnreadEvent => ({
    type: "notification.unread",
    payload: { notificationId, recipientId },
    occurredAt: new Date(),
  }),

  readLaterToggled: (
    notificationId: NotificationIdType,
    recipientId: UserIdType,
    isReadLater: boolean,
  ): NotificationReadLaterToggledEvent => ({
    type: "notification.readLaterToggled",
    payload: { notificationId, recipientId, isReadLater },
    occurredAt: new Date(),
  }),

  filterCreated: (
    filterId: NotificationFilterIdType,
    userId: UserIdType,
  ): NotificationFilterCreatedEvent => ({
    type: "notification.filter.created",
    payload: { filterId, userId },
    occurredAt: new Date(),
  }),

  filterUpdated: (
    filterId: NotificationFilterIdType,
    userId: UserIdType,
  ): NotificationFilterUpdatedEvent => ({
    type: "notification.filter.updated",
    payload: { filterId, userId },
    occurredAt: new Date(),
  }),

  filterDeleted: (
    filterId: NotificationFilterIdType,
    userId: UserIdType,
  ): NotificationFilterDeletedEvent => ({
    type: "notification.filter.deleted",
    payload: { filterId, userId },
    occurredAt: new Date(),
  }),
};
