import type { InferSelectModel } from "drizzle-orm";
import { eq, lt } from "drizzle-orm";
import { sessions } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Session } from "@/core/domain/identity/entity";
import type { SessionRepository } from "@/core/domain/identity/ports/sessionRepository";
import type {
  SessionId as SessionIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type SessionDataModel = InferSelectModel<typeof sessions>;

export class DrizzleSqliteSessionRepository implements SessionRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: SessionDataModel): Session {
    return {
      sessionId: data.id as SessionIdType,
      userId: data.userId as UserIdType,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      country: data.country,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  }

  async findById(sessionId: SessionIdType): Promise<Session | null> {
    try {
      const results = await this.executor
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find session by id",
        error,
      );
    }
  }

  async findByUserId(userId: UserIdType): Promise<Session[]> {
    try {
      const results = await this.executor
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find sessions by user id",
        error,
      );
    }
  }

  async save(session: Session): Promise<void> {
    try {
      await this.executor
        .insert(sessions)
        .values({
          id: session.sessionId,
          userId: session.userId,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          country: session.country,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        })
        .onConflictDoUpdate({
          target: sessions.id,
          set: {
            userId: session.userId,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            country: session.country,
            expiresAt: session.expiresAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save session",
        error,
      );
    }
  }

  async delete(sessionId: SessionIdType): Promise<void> {
    try {
      await this.executor.delete(sessions).where(eq(sessions.id, sessionId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete session",
        error,
      );
    }
  }

  async deleteByUserId(userId: UserIdType): Promise<void> {
    try {
      await this.executor.delete(sessions).where(eq(sessions.userId, userId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete sessions by user id",
        error,
      );
    }
  }

  async deleteExpired(now: Date): Promise<number> {
    try {
      const result = await this.executor
        .delete(sessions)
        .where(lt(sessions.expiresAt, now))
        .returning({ id: sessions.id });

      return result.length;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete expired sessions",
        error,
      );
    }
  }
}
