import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { terminateSession } from "@/core/domain/identity/services/authenticationService";
import { SessionId } from "@/core/domain/identity/valueObject";

export type LogoutInput = {
  sessionId: string;
};

export async function logout({
  container,
  input,
}: ServiceArgs<LogoutInput>): Promise<void> {
  if (input.sessionId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Session ID is required",
    );
  }

  const sessionId = SessionId.create(input.sessionId);

  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return terminateSession(
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
