import type { Session } from "@/core/domain/identity/entity";
import type {
  SessionId as SessionIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";

/**
 * Repository port for Session entity persistence.
 */
export interface SessionRepository {
  /**
   * Find a session by its unique identifier.
   */
  findById(sessionId: SessionIdType): Promise<Session | null>;

  /**
   * Find all sessions belonging to the specified user.
   */
  findByUserId(userId: UserIdType): Promise<Session[]>;

  /**
   * Save a session (insert or update).
   */
  save(session: Session): Promise<void>;

  /**
   * Delete a session by its unique identifier.
   */
  delete(sessionId: SessionIdType): Promise<void>;

  /**
   * Delete all sessions belonging to the specified user.
   */
  deleteByUserId(userId: UserIdType): Promise<void>;

  /**
   * Delete all expired sessions.
   * @returns The number of sessions deleted.
   */
  deleteExpired(now: Date): Promise<number>;
}
