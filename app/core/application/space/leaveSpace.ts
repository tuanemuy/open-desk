import type { UserId } from "@/core/domain/identity/valueObject";
import { leaveSpace as leaveSpaceDomain } from "@/core/domain/space/services/spaceMembershipService";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { getSpaceOrThrow } from "./helpers";

export type LeaveSpaceInput = {
  readonly operatorId: string;
  readonly spaceId: string;
};

export async function leaveSpace({
  container,
  input,
}: ServiceArgs<LeaveSpaceInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await getSpaceOrThrow(ctx, spaceId);

    const result = await leaveSpaceDomain(
      {
        spaceRepository: ctx.spaceRepository,
        spaceMemberRepository: ctx.spaceMemberRepository,
      },
      { spaceId, userId: operatorId },
    );

    if (!result.ok) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        `Cannot leave space: ${result.error.kind}`,
      );
    }
  });
}
