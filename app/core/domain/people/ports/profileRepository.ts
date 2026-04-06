import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Profile } from "@/core/domain/people/entity";

/**
 * Repository port for Profile entity persistence.
 */
export interface ProfileRepository {
  /**
   * Find a profile by user ID.
   * @returns The profile, or null if not found.
   */
  findByUserId(userId: UserIdType): Promise<Profile | null>;

  /**
   * Save a profile (insert or update).
   */
  save(profile: Profile): Promise<void>;

  /**
   * Delete a profile by user ID.
   * Called when the associated user is deleted.
   */
  delete(userId: UserIdType): Promise<void>;
}
