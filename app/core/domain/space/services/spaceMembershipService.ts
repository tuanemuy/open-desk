import type { DomainResult } from "@/core/domain/common/result";
import type { UserId } from "@/core/domain/identity/valueObject";
import { SpaceMember as SpaceMemberEntity } from "../entity";
import type { SpaceMemberRepository } from "../ports/spaceMemberRepository";
import type { SpaceRepository } from "../ports/spaceRepository";
import type {
  MemberEntityType as MemberEntityEnumType,
  MemberEntity as MemberEntityType,
  SpaceId as SpaceIdType,
} from "../valueObject";

// ============================================
// Error Types
// ============================================

export type SpaceNotFoundError = {
  readonly kind: "SpaceNotFound";
  readonly spaceId: SpaceIdType;
};

export type NoAdminMemberError = {
  readonly kind: "NoAdminMember";
};

export type FixedMemberError = {
  readonly kind: "FixedMember";
  readonly spaceId: SpaceIdType;
};

export type LastAdminError = {
  readonly kind: "LastAdmin";
  readonly spaceId: SpaceIdType;
};

export type NotMemberError = {
  readonly kind: "NotMember";
  readonly spaceId: SpaceIdType;
  readonly userId: UserId;
};

export type MembershipError =
  | SpaceNotFoundError
  | NoAdminMemberError
  | FixedMemberError
  | LastAdminError
  | NotMemberError;

// ============================================
// Service Dependencies
// ============================================

export type SpaceMembershipServiceDeps = {
  readonly spaceRepository: SpaceRepository;
  readonly spaceMemberRepository: SpaceMemberRepository;
};

// ============================================
// SpaceMembership Service
// ============================================

/**
 * Replace all members in a space with the specified list.
 *
 * 1. Verify space existence
 * 2. Validate at least one admin member
 * 3. Delete all existing members and replace with new list
 */
export async function replaceMembers(
  deps: SpaceMembershipServiceDeps,
  params: {
    readonly spaceId: SpaceIdType;
    readonly members: ReadonlyArray<{
      readonly entity: MemberEntityType;
      readonly isAdmin: boolean;
      readonly includeSubs: boolean;
    }>;
  },
): Promise<DomainResult<void, MembershipError>> {
  const space = await deps.spaceRepository.findById(params.spaceId);
  if (!space) {
    return {
      ok: false,
      error: { kind: "SpaceNotFound", spaceId: params.spaceId },
    };
  }

  // Validate at least one admin
  const hasAdmin = params.members.some((m) => m.isAdmin);
  if (!hasAdmin) {
    return { ok: false, error: { kind: "NoAdminMember" } };
  }

  // Create member entities
  const members = params.members.map(
    (m) =>
      SpaceMemberEntity.create({
        spaceId: params.spaceId,
        entity: m.entity,
        isAdmin: m.isAdmin,
        includeSubs: m.includeSubs,
      }).entity,
  );

  // Replace all members atomically
  await deps.spaceMemberRepository.replaceAll(params.spaceId, members);

  return { ok: true, value: undefined };
}

/**
 * Allow a user to leave a space voluntarily.
 *
 * 1. Verify space existence
 * 2. Check fixedMember setting (if true, leaving is forbidden)
 * 3. Check that the user is not the last admin
 * 4. Delete the member from the space
 */
export async function leaveSpace(
  deps: SpaceMembershipServiceDeps,
  params: {
    readonly spaceId: SpaceIdType;
    readonly userId: UserId;
  },
): Promise<DomainResult<void, MembershipError>> {
  const space = await deps.spaceRepository.findById(params.spaceId);
  if (!space) {
    return {
      ok: false,
      error: { kind: "SpaceNotFound", spaceId: params.spaceId },
    };
  }

  if (space.fixedMember) {
    return {
      ok: false,
      error: { kind: "FixedMember", spaceId: params.spaceId },
    };
  }

  // Find the member record for this user
  const member = await deps.spaceMemberRepository.findBySpaceIdAndUserId(
    params.spaceId,
    params.userId,
  );
  if (!member) {
    return {
      ok: false,
      error: {
        kind: "NotMember",
        spaceId: params.spaceId,
        userId: params.userId,
      },
    };
  }

  // If the user is an admin, ensure they are not the last one
  if (member.isAdmin) {
    const adminCount = await deps.spaceMemberRepository.countAdminsBySpaceId(
      params.spaceId,
    );
    if (adminCount <= 1) {
      return {
        ok: false,
        error: { kind: "LastAdmin", spaceId: params.spaceId },
      };
    }
  }

  await deps.spaceMemberRepository.delete(params.spaceId, member.entity);

  return { ok: true, value: undefined };
}

/**
 * Check if a user is a direct member of a space.
 * Note: Indirect membership via organization/group is handled at the use case layer.
 */
export async function isMember(
  deps: Pick<SpaceMembershipServiceDeps, "spaceMemberRepository">,
  params: {
    readonly spaceId: SpaceIdType;
    readonly userId: UserId;
  },
): Promise<boolean> {
  const member = await deps.spaceMemberRepository.findBySpaceIdAndUserId(
    params.spaceId,
    params.userId,
  );
  return member !== null;
}

/**
 * Validate that at least one admin remains after optionally excluding a user.
 */
export async function validateAdminExists(
  deps: Pick<SpaceMembershipServiceDeps, "spaceMemberRepository">,
  params: {
    readonly spaceId: SpaceIdType;
    readonly excludeUserId?: UserId;
  },
): Promise<DomainResult<void, LastAdminError>> {
  const admins = await deps.spaceMemberRepository.findAdminsBySpaceId(
    params.spaceId,
  );

  const remainingAdmins = params.excludeUserId
    ? admins.filter(
        (a) =>
          a.entity.type !== ("USER" as MemberEntityEnumType) ||
          a.entity.id !== params.excludeUserId,
      )
    : admins;

  if (remainingAdmins.length === 0) {
    return {
      ok: false,
      error: { kind: "LastAdmin", spaceId: params.spaceId },
    };
  }

  return { ok: true, value: undefined };
}
