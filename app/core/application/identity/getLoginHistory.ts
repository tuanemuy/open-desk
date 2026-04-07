import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { UserId } from "@/core/domain/identity/valueObject";
import type { LoginHistoryItemOutput, LoginHistoryOutput } from "./dto";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES_PER_USER_AGENT = 10;

export type GetLoginHistoryInput = {
  userId: string;
};

export async function getLoginHistory({
  container,
  input,
}: ServiceArgs<GetLoginHistoryInput>): Promise<LoginHistoryOutput> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
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
  const twoWeeksAgo = new Date(now.getTime() - TWO_WEEKS_MS);

  const recentSessions = allSessions.filter(
    (session) => session.createdAt >= twoWeeksAgo,
  );

  const groupedByUserAgent = new Map<string, LoginHistoryItemOutput[]>();

  for (const session of recentSessions) {
    const group = groupedByUserAgent.get(session.userAgent) ?? [];
    group.push({
      sessionId: session.sessionId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      country: session.country,
      loginAt: session.createdAt,
    });
    groupedByUserAgent.set(session.userAgent, group);
  }

  const loginHistories: LoginHistoryItemOutput[] = [];

  for (const [, entries] of groupedByUserAgent) {
    entries.sort((a, b) => b.loginAt.getTime() - a.loginAt.getTime());
    const topEntries = entries.slice(0, MAX_ENTRIES_PER_USER_AGENT);
    loginHistories.push(...topEntries);
  }

  loginHistories.sort((a, b) => b.loginAt.getTime() - a.loginAt.getTime());

  return { loginHistories };
}
