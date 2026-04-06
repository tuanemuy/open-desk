import type { WithEvents } from "@/core/domain/common/event";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Notification } from "../entity";
import { Notification as NotificationEntity } from "../entity";
import type { NotificationEvent } from "../events";
import type { SourceType as SourceTypeType } from "../valueObject";

/**
 * Result of notification generation containing all created notifications and their events.
 */
export type GenerationResult = {
  readonly notifications: readonly Notification[];
  readonly events: readonly NotificationEvent[];
};

/**
 * Filters a list of recipient IDs to exclude the sender (self-notification exclusion).
 */
function excludeSender(
  recipientIds: readonly UserIdType[],
  senderId: UserIdType | null,
): UserIdType[] {
  if (senderId === null) {
    return [...recipientIds];
  }
  return recipientIds.filter((id) => id !== senderId);
}

/**
 * Removes duplicate user IDs from the recipient list.
 */
function deduplicateRecipients(
  recipientIds: readonly UserIdType[],
): UserIdType[] {
  return [...new Set(recipientIds)];
}

/**
 * Generates notifications for a list of recipients, collecting all entities and events.
 */
function generateForRecipients(
  recipientIds: readonly UserIdType[],
  params: {
    type:
      | "MENTION"
      | "APP_CONDITION"
      | "RECORD_CONDITION"
      | "REMINDER"
      | "SPACE";
    senderId: UserIdType | null;
    sourceType: SourceTypeType;
    sourceId: string;
    title: string;
    content: string;
  },
): GenerationResult {
  const notifications: Notification[] = [];
  const events: NotificationEvent[] = [];

  for (const recipientId of recipientIds) {
    const result: WithEvents<Notification, NotificationEvent> =
      NotificationEntity.create({
        recipientId,
        type: params.type,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        senderId: params.senderId,
        title: params.title,
        content: params.content,
      });
    notifications.push(result.entity);
    events.push(...result.events);
  }

  return { notifications, events };
}

/**
 * Domain service responsible for generating notifications.
 *
 * Key responsibilities:
 * - Self-notification exclusion: the sender does not receive a notification for their own action
 * - Deduplication: each recipient receives at most one notification per generation call
 * - Mention priority: when generating app condition notifications, recipients who were
 *   already mentioned should be excluded (handled by the caller passing excludeUserIds)
 */
export const NotificationGenerationService = {
  /**
   * Generate mention notifications.
   * Called when a user is @-mentioned in a comment or thread post.
   * The sender is excluded from the recipient list.
   *
   * @returns Generated notifications for each mentioned user (excluding the sender)
   */
  generateMentionNotifications: (params: {
    senderId: UserIdType;
    sourceType: SourceTypeType;
    sourceId: string;
    mentionedUserIds: readonly UserIdType[];
    title: string;
    content: string;
  }): GenerationResult => {
    const recipients = deduplicateRecipients(
      excludeSender(params.mentionedUserIds, params.senderId),
    );

    return generateForRecipients(recipients, {
      type: "MENTION",
      senderId: params.senderId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      title: params.title,
      content: params.content,
    });
  },

  /**
   * Generate app condition notifications.
   * Called on record add/edit/comment/status change/file import.
   * The sender is excluded from the recipient list.
   * To enforce mention priority, the caller should pass excludeUserIds
   * containing user IDs that already received a mention notification
   * for the same event.
   *
   * @returns Generated notifications for each recipient (excluding sender and excludeUserIds)
   */
  generateAppConditionNotifications: (params: {
    senderId: UserIdType;
    sourceType: SourceTypeType;
    sourceId: string;
    recipientIds: readonly UserIdType[];
    excludeUserIds: readonly UserIdType[];
    title: string;
    content: string;
  }): GenerationResult => {
    const excludeSet = new Set<UserIdType>([...params.excludeUserIds]);
    const filteredRecipients = params.recipientIds.filter(
      (id) => !excludeSet.has(id),
    );
    const recipients = deduplicateRecipients(
      excludeSender(filteredRecipients, params.senderId),
    );

    return generateForRecipients(recipients, {
      type: "APP_CONDITION",
      senderId: params.senderId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      title: params.title,
      content: params.content,
    });
  },

  /**
   * Generate record condition notifications.
   * Called when a record matches specific filter conditions.
   * The sender is excluded from the recipient list.
   *
   * @returns Generated notifications for each recipient (excluding the sender)
   */
  generateRecordConditionNotifications: (params: {
    senderId: UserIdType;
    sourceType: SourceTypeType;
    sourceId: string;
    recipientIds: readonly UserIdType[];
    title: string;
    content: string;
  }): GenerationResult => {
    const recipients = deduplicateRecipients(
      excludeSender(params.recipientIds, params.senderId),
    );

    return generateForRecipients(recipients, {
      type: "RECORD_CONDITION",
      senderId: params.senderId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      title: params.title,
      content: params.content,
    });
  },

  /**
   * Generate reminder notifications.
   * Called by the scheduler when a datetime condition is met.
   * Reminders are system-generated so senderId is null.
   *
   * @returns Generated notifications for each recipient
   */
  generateReminderNotifications: (params: {
    sourceType: SourceTypeType;
    sourceId: string;
    recipientIds: readonly UserIdType[];
    title: string;
    content: string;
  }): GenerationResult => {
    const recipients = deduplicateRecipients(params.recipientIds);

    return generateForRecipients(recipients, {
      type: "REMINDER",
      senderId: null,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      title: params.title,
      content: params.content,
    });
  },

  /**
   * Generate space notifications.
   * Called when a thread post or reply is made in a space.
   * The sender is excluded from the recipient list.
   *
   * @returns Generated notifications for each space member (excluding the sender)
   */
  generateSpaceNotifications: (params: {
    senderId: UserIdType;
    sourceType: SourceTypeType;
    sourceId: string;
    recipientIds: readonly UserIdType[];
    title: string;
    content: string;
  }): GenerationResult => {
    const recipients = deduplicateRecipients(
      excludeSender(params.recipientIds, params.senderId),
    );

    return generateForRecipients(recipients, {
      type: "SPACE",
      senderId: params.senderId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      title: params.title,
      content: params.content,
    });
  },
};
