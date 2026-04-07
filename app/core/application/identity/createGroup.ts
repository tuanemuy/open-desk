import {
  ConflictError,
  ConflictErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { Group } from "@/core/domain/identity/entity";
import type { GroupOutput } from "./dto";

export type CreateGroupInput = {
  name: string;
  code: string;
};

export async function createGroup({
  container,
  input,
}: ServiceArgs<CreateGroupInput>): Promise<GroupOutput> {
  if (input.name.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Group name is required",
    );
  }
  if (input.code.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Group code is required",
    );
  }

  const existingByCode = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.groupRepository.findByCode(input.code);
    },
  );

  if (existingByCode) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      `Group code '${input.code}' is already in use`,
    );
  }

  const { entity: group } = Group.create({
    name: input.name,
    code: input.code,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.groupRepository.save(group);
  });

  return {
    groupId: group.groupId,
    name: group.name,
    code: group.code,
  };
}
