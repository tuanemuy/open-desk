import { User } from "@/core/domain/identity/entity";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Email, LoginName } from "@/core/domain/identity/valueObject";
import { SpaceMember } from "@/core/domain/space/entity";
import {
  MemberEntity,
  MemberEntityType,
  type SpaceId,
} from "@/core/domain/space/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { assertSystemAdmin } from "../access-control/helpers";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { AddGuestUserOutput } from "./dto";

export type AddGuestUserInput = {
  readonly operatorId: string;
  readonly name: string;
  readonly email: string;
  readonly company?: string;
  readonly spaceIds?: readonly string[];
};

export async function addGuestUser({
  container,
  input,
}: ServiceArgs<AddGuestUserInput>): Promise<AddGuestUserOutput> {
  const operatorId = input.operatorId as UserId;

  if (input.name.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Name is required",
    );
  }

  const email = Email.create(input.email);
  const loginName = LoginName.create(input.email);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);
    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );
    assertSystemAdmin(operatorPermissions, userContext);

    const { entity: guestUser } = User.create({
      loginName,
      displayName: input.name,
      email,
    });

    await ctx.userRepository.save(guestUser);

    if (input.spaceIds && input.spaceIds.length > 0) {
      for (const sid of input.spaceIds) {
        const spaceId = sid as SpaceId;
        const space = await ctx.spaceRepository.findById(spaceId);
        if (!space) {
          throw new NotFoundError(
            NotFoundErrorCode.NotFound,
            `Space ${spaceId} not found`,
          );
        }
        if (!space.isGuest) {
          throw new ValidationError(
            ValidationErrorCode.InvalidInput,
            `Space ${spaceId} is not a guest space`,
          );
        }

        const memberEntity = MemberEntity.create({
          type: MemberEntityType.User,
          id: guestUser.userId,
          code: guestUser.loginName,
        });
        const { entity: member } = SpaceMember.create({
          spaceId,
          entity: memberEntity,
          isAdmin: false,
          includeSubs: false,
        });
        await ctx.spaceMemberRepository.save(member);
      }
    }

    return {
      userId: guestUser.userId,
      name: guestUser.displayName,
      email: guestUser.email,
      company: input.company ?? null,
    };
  });
}
