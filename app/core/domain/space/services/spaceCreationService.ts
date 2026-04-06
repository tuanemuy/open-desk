import type { DomainResult } from "@/core/domain/common/result";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { Space, SpaceMember, SpaceTemplate, Thread } from "../entity";
import {
  Space as SpaceEntity,
  SpaceMember as SpaceMemberEntity,
  Thread as ThreadEntity,
} from "../entity";
import type { SpaceMemberRepository } from "../ports/spaceMemberRepository";
import type { SpaceRepository } from "../ports/spaceRepository";
import type { SpaceTemplateRepository } from "../ports/spaceTemplateRepository";
import type { ThreadRepository } from "../ports/threadRepository";
import type {
  AppCreationPermission as AppCreationPermissionType,
  CoverImage as CoverImageType,
  MemberEntity as MemberEntityType,
  PortalDisplayConfig as PortalDisplayConfigType,
  SpaceName as SpaceNameType,
  SpaceTemplateId as SpaceTemplateIdType,
} from "../valueObject";

// ============================================
// Constants
// ============================================

const REGULAR_SPACE_LIMIT = 500;
const GUEST_SPACE_LIMIT = 500;

// ============================================
// Error Types
// ============================================

export type SpaceLimitExceededError = {
  readonly kind: "SpaceLimitExceeded";
  readonly isGuest: boolean;
  readonly limit: number;
};

export type NoAdminMemberError = {
  readonly kind: "NoAdminMember";
};

export type GuestSpaceFeatureDisabledError = {
  readonly kind: "GuestSpaceFeatureDisabled";
};

export type SpaceTemplateNotFoundError = {
  readonly kind: "SpaceTemplateNotFound";
  readonly templateId: SpaceTemplateIdType;
};

export type SpaceCreationError =
  | SpaceLimitExceededError
  | NoAdminMemberError
  | GuestSpaceFeatureDisabledError
  | SpaceTemplateNotFoundError;

// ============================================
// Service Dependencies
// ============================================

export type SpaceCreationServiceDeps = {
  readonly spaceRepository: SpaceRepository;
  readonly threadRepository: ThreadRepository;
  readonly spaceMemberRepository: SpaceMemberRepository;
  readonly spaceTemplateRepository: SpaceTemplateRepository;
};

// ============================================
// SpaceCreation Service
// ============================================

/**
 * Create a space from scratch with a default thread and initial members.
 *
 * 1. Force isPrivate to true when isGuest is true
 * 2. Check space count limit (regular: 500, guest: 500)
 * 3. Validate that at least one admin member is specified
 * 4. Create Space entity
 * 5. Create default Thread (title = space name)
 * 6. Add creator as admin SpaceMember
 * 7. Add specified members as SpaceMembers
 * 8. Save all entities via repositories
 */
export async function createSpace(
  deps: Pick<
    SpaceCreationServiceDeps,
    "spaceRepository" | "threadRepository" | "spaceMemberRepository"
  >,
  params: {
    readonly name: SpaceNameType;
    readonly isPrivate: boolean;
    readonly isGuest: boolean;
    readonly useMultiThread: boolean;
    readonly fixedMember: boolean;
    readonly appCreationPermission: AppCreationPermissionType;
    readonly coverImage: CoverImageType;
    readonly members: ReadonlyArray<{
      readonly entity: MemberEntityType;
      readonly isAdmin: boolean;
      readonly includeSubs: boolean;
    }>;
    readonly creatorId: UserId;
  },
): Promise<
  DomainResult<
    { readonly space: Space; readonly defaultThread: Thread },
    SpaceCreationError
  >
> {
  // Validate at least one admin member
  const hasAdmin = params.members.some((m) => m.isAdmin);
  if (!hasAdmin) {
    return { ok: false, error: { kind: "NoAdminMember" } };
  }

  // Check space count limit
  const isGuest = params.isGuest;
  if (isGuest) {
    const guestCount = await deps.spaceRepository.countGuest();
    if (guestCount >= GUEST_SPACE_LIMIT) {
      return {
        ok: false,
        error: {
          kind: "SpaceLimitExceeded",
          isGuest: true,
          limit: GUEST_SPACE_LIMIT,
        },
      };
    }
  } else {
    const regularCount = await deps.spaceRepository.countRegular();
    if (regularCount >= REGULAR_SPACE_LIMIT) {
      return {
        ok: false,
        error: {
          kind: "SpaceLimitExceeded",
          isGuest: false,
          limit: REGULAR_SPACE_LIMIT,
        },
      };
    }
  }

  // Create default thread first to obtain its ID
  const { entity: defaultThread } = ThreadEntity.create({
    spaceId: "" as never, // will be updated after space creation
    title: params.name,
    creatorId: params.creatorId,
    isDefault: true,
  });

  // Create space
  const { entity: space } = SpaceEntity.create({
    name: params.name,
    isPrivate: params.isPrivate,
    isGuest: params.isGuest,
    useMultiThread: params.useMultiThread,
    fixedMember: params.fixedMember,
    coverImage: params.coverImage,
    portalDisplay: {
      showAnnouncement: true,
      showThreadList: true,
      showAppList: true,
      showMemberList: true,
      showRelatedLinkList: true,
    } as PortalDisplayConfigType,
    appCreationPermission: params.appCreationPermission,
    creatorId: params.creatorId,
    defaultThreadId: defaultThread.threadId,
  });

  // Re-create default thread with correct spaceId
  const { entity: threadWithSpaceId } = ThreadEntity.create({
    spaceId: space.spaceId,
    title: params.name,
    creatorId: params.creatorId,
    isDefault: true,
  });
  // Reconstruct with the same threadId as the one assigned to space
  const finalThread = ThreadEntity.reconstruct({
    ...threadWithSpaceId,
    threadId: defaultThread.threadId,
  });

  // Save space and thread
  await deps.spaceRepository.save(space);
  await deps.threadRepository.save(finalThread);

  // Add members
  const members: SpaceMember[] = params.members.map(
    (m) =>
      SpaceMemberEntity.create({
        spaceId: space.spaceId,
        entity: m.entity,
        isAdmin: m.isAdmin,
        includeSubs: m.includeSubs,
      }).entity,
  );

  for (const member of members) {
    await deps.spaceMemberRepository.save(member);
  }

  return {
    ok: true,
    value: { space, defaultThread: finalThread },
  };
}

/**
 * Create a space from a template.
 *
 * 1. Fetch template from SpaceTemplateRepository
 * 2. Create Space using template settings (name, isPrivate, fixedMember overridden by params)
 * 3. Create Threads based on template threadNames
 * 4. Add members
 * 5. Save all entities via repositories
 */
export async function createSpaceFromTemplate(
  deps: SpaceCreationServiceDeps,
  params: {
    readonly templateId: SpaceTemplateIdType;
    readonly name: SpaceNameType;
    readonly isPrivate: boolean;
    readonly isGuest: boolean;
    readonly fixedMember: boolean;
    readonly members: ReadonlyArray<{
      readonly entity: MemberEntityType;
      readonly isAdmin: boolean;
      readonly includeSubs: boolean;
    }>;
    readonly creatorId: UserId;
  },
): Promise<
  DomainResult<
    { readonly space: Space; readonly threads: readonly Thread[] },
    SpaceCreationError
  >
> {
  // Fetch template
  const template: SpaceTemplate | null =
    await deps.spaceTemplateRepository.findById(params.templateId);
  if (!template) {
    return {
      ok: false,
      error: { kind: "SpaceTemplateNotFound", templateId: params.templateId },
    };
  }

  // Validate at least one admin member
  const hasAdmin = params.members.some((m) => m.isAdmin);
  if (!hasAdmin) {
    return { ok: false, error: { kind: "NoAdminMember" } };
  }

  // Check space count limit
  const isGuest = params.isGuest;
  if (isGuest) {
    const guestCount = await deps.spaceRepository.countGuest();
    if (guestCount >= GUEST_SPACE_LIMIT) {
      return {
        ok: false,
        error: {
          kind: "SpaceLimitExceeded",
          isGuest: true,
          limit: GUEST_SPACE_LIMIT,
        },
      };
    }
  } else {
    const regularCount = await deps.spaceRepository.countRegular();
    if (regularCount >= REGULAR_SPACE_LIMIT) {
      return {
        ok: false,
        error: {
          kind: "SpaceLimitExceeded",
          isGuest: false,
          limit: REGULAR_SPACE_LIMIT,
        },
      };
    }
  }

  // Create default thread first (first threadName or space name)
  const defaultThreadName =
    template.threadNames.length > 0 ? template.threadNames[0] : params.name;
  const { entity: defaultThread } = ThreadEntity.create({
    spaceId: "" as never,
    title: defaultThreadName as string,
    creatorId: params.creatorId,
    isDefault: true,
  });

  // Create space from template settings
  const { entity: space } = SpaceEntity.create({
    name: params.name,
    isPrivate: params.isPrivate,
    isGuest: params.isGuest,
    useMultiThread: template.useMultiThread,
    fixedMember: params.fixedMember,
    coverImage: template.coverImage,
    portalDisplay: template.portalDisplay,
    appCreationPermission: template.appCreationPermission,
    creatorId: params.creatorId,
    defaultThreadId: defaultThread.threadId,
  });

  // Re-create default thread with correct spaceId
  const finalDefaultThread = ThreadEntity.reconstruct({
    ...defaultThread,
    spaceId: space.spaceId,
  });

  // Create additional threads from template (skip the first if it was used as default)
  const threads: Thread[] = [finalDefaultThread];
  const additionalThreadNames =
    template.threadNames.length > 0 ? template.threadNames.slice(1) : [];
  for (const threadName of additionalThreadNames) {
    const { entity: thread } = ThreadEntity.create({
      spaceId: space.spaceId,
      title: threadName,
      creatorId: params.creatorId,
      isDefault: false,
    });
    threads.push(thread);
  }

  // Save space and threads
  await deps.spaceRepository.save(space);
  for (const thread of threads) {
    await deps.threadRepository.save(thread);
  }

  // Add members
  const members: SpaceMember[] = params.members.map(
    (m) =>
      SpaceMemberEntity.create({
        spaceId: space.spaceId,
        entity: m.entity,
        isAdmin: m.isAdmin,
        includeSubs: m.includeSubs,
      }).entity,
  );

  for (const member of members) {
    await deps.spaceMemberRepository.save(member);
  }

  return {
    ok: true,
    value: { space, threads },
  };
}
