import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { Group } from "@/core/domain/identity/entity";
import { GroupId } from "@/core/domain/identity/valueObject";
import type { GroupOutput } from "./dto";

export type UpdateGroupInput = {
  groupId: string;
  name: string;
};

export async function updateGroup({
  container,
  input,
}: ServiceArgs<UpdateGroupInput>): Promise<GroupOutput> {
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

  const { entity: updatedGroup } = Group.rename(existingGroup, input.name);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.groupRepository.save(updatedGroup);
  });

  return {
    groupId: updatedGroup.groupId,
    name: updatedGroup.name,
    code: updatedGroup.code,
  };
}
