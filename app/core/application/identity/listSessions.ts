import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { Session } from "@/core/domain/identity/entity";
import { UserId } from "@/core/domain/identity/valueObject";
import type { SessionListOutput } from "./dto";

export type ListSessionsInput = {
  userId: string;
  currentSessionId?: string;
  offset?: number;
  limit?: number;
};

export async function listSessions({
  container,
  input,
}: ServiceArgs<ListSessionsInput>): Promise<SessionListOutput> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }

  const offset = input.offset ?? 0;
  const limit = input.limit ?? 5;

  if (offset < 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Offset must be non-negative",
    );
  }
  if (limit < 1 || limit > 5) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Limit must be between 1 and 5",
    );
  }

  const userId = UserId.create(input.userId);

  const user = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.userRepository.findById(userId);
  });

  if (!user) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `User ${input.userId} not found`,
    );
  }

  const allSessions = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.sessionRepository.findByUserId(userId);
    },
  );

  const now = new Date();
  const activeSessions = allSessions
    .filter((session) => !Session.isExpired(session, now))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const totalCount = activeSessions.length;
  const paginatedSessions = activeSessions.slice(offset, offset + limit);

  return {
    sessions: paginatedSessions.map((session) => ({
      sessionId: session.sessionId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      country: session.country,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.sessionId === input.currentSessionId,
    })),
    totalCount,
  };
}
