import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { GroupId } from "@/core/domain/identity/valueObject";

export type DeleteGroupInput = {
  groupId: string;
};

export async function deleteGroup({
  container,
  input,
}: ServiceArgs<DeleteGroupInput>): Promise<void> {
  if (input.groupId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Group ID is required",
    );
  }

  const groupId = GroupId.create(input.groupId);

  const existingGroup = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.groupRepository.findById(groupId);
    },
  );

  if (!existingGroup) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Group ${input.groupId} not found`,
    );
  }

  const members = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.findByGroupId(groupId);
    },
  );

  if (members.length > 0) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      "Cannot delete a group that still has members",
    );
  }

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.groupRepository.delete(groupId);
  });
}
