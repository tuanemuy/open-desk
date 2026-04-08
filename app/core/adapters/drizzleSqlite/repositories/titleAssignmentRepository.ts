import { and, eq } from "drizzle-orm";
import { userTitles } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { TitleAssignmentRepository } from "@/core/domain/identity/ports/titleAssignmentRepository";
import type {
  TitleId as TitleIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

export class DrizzleSqliteTitleAssignmentRepository
  implements TitleAssignmentRepository
{
  constructor(private readonly executor: Executor) {}

  async assign(params: {
    userId: UserIdType;
    titleId: TitleIdType;
  }): Promise<void> {
    try {
      await this.executor
        .insert(userTitles)
        .values({
          userId: params.userId,
          titleId: params.titleId,
        })
        .onConflictDoNothing();
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to assign title to user",
        error,
      );
    }
  }

  async unassign(params: {
    userId: UserIdType;
    titleId: TitleIdType;
  }): Promise<void> {
    try {
      await this.executor
        .delete(userTitles)
        .where(
          and(
            eq(userTitles.userId, params.userId),
            eq(userTitles.titleId, params.titleId),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to unassign title from user",
        error,
      );
    }
  }

  async getTitleIdsByUserId(userId: UserIdType): Promise<TitleIdType[]> {
    try {
      const results = await this.executor
        .select({ titleId: userTitles.titleId })
        .from(userTitles)
        .where(eq(userTitles.userId, userId));

      return results.map((r) => r.titleId as TitleIdType);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to get title ids by user id",
        error,
      );
    }
  }

  async getUserIdsByTitleId(titleId: TitleIdType): Promise<UserIdType[]> {
    try {
      const results = await this.executor
        .select({ userId: userTitles.userId })
        .from(userTitles)
        .where(eq(userTitles.titleId, titleId));

      return results.map((r) => r.userId as UserIdType);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to get user ids by title id",
        error,
      );
    }
  }
}
