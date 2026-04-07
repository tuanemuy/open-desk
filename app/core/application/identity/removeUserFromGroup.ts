import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { GroupId, UserId } from "@/core/domain/identity/valueObject";

export type RemoveUserFromGroupInput = {
  userId: string;
  groupId: string;
};

export async function removeUserFromGroup({
  container,
  input,
}: ServiceArgs<RemoveUserFromGroupInput>): Promise<void> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }
  if (input.groupId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Group ID is required",
    );
  }

  const userId = UserId.create(input.userId);
  const groupId = GroupId.create(input.groupId);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const user = await ctx.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `User ${input.userId} not found`,
      );
    }

    const group = await ctx.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Group ${input.groupId} not found`,
      );
    }

    await ctx.membershipRepository.removeUserFromGroup({ userId, groupId });
  });
}
