import type {
  TitleId as TitleIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";

/**
 * Repository port for managing user-title assignments.
 */
export interface TitleAssignmentRepository {
  /**
   * Assign a title to a user.
   */
  assign(params: { userId: UserIdType; titleId: TitleIdType }): Promise<void>;

  /**
   * Unassign a title from a user.
   */
  unassign(params: { userId: UserIdType; titleId: TitleIdType }): Promise<void>;

  /**
   * Get all title IDs assigned to a user.
   */
  getTitleIdsByUserId(userId: UserIdType): Promise<TitleIdType[]>;

  /**
   * Get all user IDs that have a specific title assigned.
   */
  getUserIdsByTitleId(titleId: TitleIdType): Promise<UserIdType[]>;
}
