import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { terminateSession as terminateSessionService } from "@/core/domain/identity/services/authenticationService";
import { SessionId, UserId } from "@/core/domain/identity/valueObject";

export type TerminateSessionInput = {
  userId: string;
  sessionId: string;
};

export async function terminateSession({
  container,
  input,
}: ServiceArgs<TerminateSessionInput>): Promise<void> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }
  if (input.sessionId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Session ID is required",
    );
  }

  const userId = UserId.create(input.userId);
  const sessionId = SessionId.create(input.sessionId);

  const session = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.sessionRepository.findById(sessionId);
    },
  );

  if (!session) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Session ${input.sessionId} not found`,
    );
  }

  if (session.userId !== userId) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Session ${input.sessionId} not found`,
    );
  }

  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return terminateSessionService(
      { sessionRepository: ctx.sessionRepository },
      sessionId,
    );
  });

  if (!result.ok) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Session ${input.sessionId} not found`,
    );
  }
}
