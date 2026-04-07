import { UserId } from "@/core/domain/identity/valueObject";
import { getOrCreateThread as getOrCreateThreadService } from "@/core/domain/message/services/messageThreadService";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { GetOrCreateThreadOutput } from "./dto";

export type GetOrCreateThreadInput = {
  operatorId: string;
  counterpartId: string;
};

export async function getOrCreateThread({
  container,
  input,
}: ServiceArgs<GetOrCreateThreadInput>): Promise<GetOrCreateThreadOutput> {
  if (!container.config.features.peopleAndMessageEnabled) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "People and Message features are disabled",
    );
  }

  const operatorId = UserId.create(input.operatorId);
  const counterpartId = UserId.create(input.counterpartId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    // Check that the counterpart is not a guest user (inactive user)
    const counterpartUser = await ctx.userRepository.findById(counterpartId);
    if (!counterpartUser || !counterpartUser.isActive) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Cannot create a message thread with an inactive or non-existent user",
      );
    }

    const result = await getOrCreateThreadService(
      { messageThreadRepository: ctx.messageThreadRepository },
      operatorId,
      counterpartId,
    );

    if (!result.ok) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Cannot create a message thread with yourself",
      );
    }

    const thread = result.value;
    return {
      threadId: thread.threadId,
      participantIds: [thread.participantIds[0], thread.participantIds[1]] as [
        string,
        string,
      ],
      lastMessageAt: thread.lastMessageAt,
      createdAt: thread.createdAt,
    };
  });
}
