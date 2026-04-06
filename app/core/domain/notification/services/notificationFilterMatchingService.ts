import type { Notification, NotificationFilter } from "../entity";
import type {
  BuiltInFilterType,
  LocationCondition as LocationConditionType,
  NotificationSource as NotificationSourceType,
} from "../valueObject";

/**
 * Domain service that determines whether a notification matches a filter's conditions.
 * This is a pure domain logic service with no external dependencies.
 *
 * Combination logic:
 * - Location conditions (INCLUDE mode): OR - matches if any condition matches
 * - Location conditions (EXCLUDE mode): NOR - matches only if none of the conditions match
 * - Sender conditions: OR - matches if any condition matches; empty array = all senders
 */
export const NotificationFilterMatchingService = {
  /**
   * Determine if a notification matches a custom or built-in filter.
   *
   * Evaluation order:
   * 1. Notification type filter
   * 2. Location conditions
   * 3. Sender conditions
   *
   * All conditions must be satisfied (AND between condition groups).
   *
   * @param notification The notification to evaluate
   * @param filter The filter to apply
   * @param notificationSource The source information for location condition evaluation
   * @returns true if the notification matches the filter
   */
  matches: (
    notification: Notification,
    filter: NotificationFilter,
    notificationSource: NotificationSourceType,
  ): boolean => {
    // 1. Check notification type filter
    if (!matchesNotificationType(notification, filter)) {
      return false;
    }

    // 2. Check location conditions
    if (
      !matchesLocationConditions(
        notificationSource,
        filter.locationMode,
        filter.locationConditions,
      )
    ) {
      return false;
    }

    // 3. Check sender conditions
    if (!matchesSenderConditions(notification, filter)) {
      return false;
    }

    return true;
  },

  /**
   * Determine if a notification matches a built-in filter.
   *
   * Built-in filter rules:
   * - MENTION: notification.type === "MENTION"
   * - READ_LATER: notification.isReadLater === true
   * - ALL: always true
   *
   * @param notification The notification to evaluate
   * @param builtInFilter The built-in filter type
   * @returns true if the notification matches the built-in filter
   */
  matchesBuiltIn: (
    notification: Notification,
    builtInFilter: BuiltInFilterType,
  ): boolean => {
    switch (builtInFilter) {
      case "MENTION":
        return notification.type === "MENTION";
      case "READ_LATER":
        return notification.isReadLater;
      case "ALL":
        return true;
    }
  },
};

/**
 * Check if the notification matches the filter's notification type setting.
 */
function matchesNotificationType(
  notification: Notification,
  filter: NotificationFilter,
): boolean {
  if (filter.notificationType === "ALL") {
    return true;
  }
  // MENTION: only match mention notifications
  return notification.type === "MENTION";
}

/**
 * Check if the notification source matches the filter's location conditions.
 *
 * - ALL mode: always matches
 * - INCLUDE mode: matches if any location condition matches (OR)
 * - EXCLUDE mode: matches only if none of the location conditions match (NOR)
 */
function matchesLocationConditions(
  source: NotificationSourceType,
  mode: NotificationFilter["locationMode"],
  conditions: readonly LocationConditionType[],
): boolean {
  if (mode === "ALL") {
    return true;
  }

  const hasMatch = conditions.some((condition) =>
    matchesSingleLocationCondition(source, condition),
  );

  if (mode === "INCLUDE") {
    return hasMatch;
  }

  // EXCLUDE mode: match only if none matched
  return !hasMatch;
}

/**
 * Check if a notification source matches a single location condition.
 *
 * A location condition matches when:
 * 1. The source's locationType matches the condition's locationType
 * 2. AND either the condition's locationId is null (meaning "all of this type")
 *    OR the condition's locationId matches the source's specific ID
 */
function matchesSingleLocationCondition(
  source: NotificationSourceType,
  condition: LocationConditionType,
): boolean {
  if (source.locationType !== condition.locationType) {
    return false;
  }

  // null locationId means "all of this type"
  if (condition.locationId === null) {
    return true;
  }

  // Match against the specific ID based on location type
  switch (condition.locationType) {
    case "APP":
      return source.appId === condition.locationId;
    case "SPACE":
      return source.spaceId === condition.locationId;
    case "PEOPLE":
    case "MESSAGE":
      // For PEOPLE and MESSAGE, the locationId directly matches
      return false;
  }
}

/**
 * Check if the notification's sender matches the filter's sender conditions.
 *
 * Empty sender conditions = all senders match.
 * Otherwise, sender conditions are combined with OR.
 */
function matchesSenderConditions(
  notification: Notification,
  filter: NotificationFilter,
): boolean {
  // Empty conditions means all senders are included
  if (filter.senderConditions.length === 0) {
    return true;
  }

  // System notifications (null sender) do not match any specific sender conditions
  if (notification.senderId === null) {
    return false;
  }

  // OR: any matching sender condition satisfies the filter
  return filter.senderConditions.some((condition) => {
    if (condition.senderType === "USER") {
      return notification.senderId === condition.senderId;
    }
    // For ORGANIZATION and GROUP sender types,
    // the actual membership resolution is handled at the infrastructure level.
    // At the domain level we can only do direct ID comparison.
    return false;
  });
}
