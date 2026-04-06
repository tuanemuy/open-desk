import type {
  NotificationSource as NotificationSourceType,
  SourceType as SourceTypeType,
} from "@/core/domain/notification/valueObject";

/**
 * Port interface for resolving notification source information.
 * Used to obtain appId, spaceId, etc. needed for filter location condition evaluation.
 * The implementation in the infrastructure layer references other domain repositories to resolve.
 */
export interface NotificationSourceResolver {
  /**
   * Resolve the notification source information.
   * Retrieves the appId, spaceId, etc. needed for location condition evaluation.
   *
   * @param sourceType The source entity type
   * @param sourceId The source entity ID
   * @returns The source information, or null if it cannot be resolved
   */
  resolve(
    sourceType: SourceTypeType,
    sourceId: string,
  ): Promise<NotificationSourceType | null>;
}
