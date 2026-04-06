import type { DomainResult } from "@/core/domain/common/result";
import type { UserId } from "@/core/domain/identity/valueObject";
import { ThreadFollow as ThreadFollowEntity } from "../entity";
import type { SpaceRepository } from "../ports/spaceRepository";
import type { ThreadFollowRepository } from "../ports/threadFollowRepository";
import type { ThreadRepository } from "../ports/threadRepository";
import type {
  SpaceId as SpaceIdType,
  ThreadId as ThreadIdType,
} from "../valueObject";

// ============================================
// Error Types
// ============================================

export type ThreadNotFoundError = {
  readonly kind: "ThreadNotFound";
  readonly threadId: ThreadIdType;
};

export type FixedMemberError = {
  readonly kind: "FixedMember";
  readonly spaceId: SpaceIdType;
};

export type AlreadyFollowingError = {
  readonly kind: "AlreadyFollowing";
  readonly threadId: ThreadIdType;
  readonly userId: UserId;
};

export type NotFollowingError = {
  readonly kind: "NotFollowing";
  readonly threadId: ThreadIdType;
  readonly userId: UserId;
};

export type ThreadFollowError =
  | ThreadNotFoundError
  | FixedMemberError
  | AlreadyFollowingError
  | NotFollowingError;

// ============================================
// Service Dependencies
// ============================================

export type ThreadFollowServiceDeps = {
  readonly spaceRepository: SpaceRepository;
  readonly threadRepository: ThreadRepository;
  readonly threadFollowRepository: ThreadFollowRepository;
};

// ============================================
// ThreadFollow Service
// ============================================

/**
 * Follow a thread.
 *
 * 1. Verify thread existence
 * 2. Check space fixedMember setting (if true, follow changes are forbidden)
 * 3. Check that the user is not already following
 * 4. Save follow relationship
 */
export async function follow(
  deps: ThreadFollowServiceDeps,
  params: {
    readonly threadId: ThreadIdType;
    readonly userId: UserId;
  },
): Promise<DomainResult<void, ThreadFollowError>> {
  const thread = await deps.threadRepository.findById(params.threadId);
  if (!thread) {
    return {
      ok: false,
      error: { kind: "ThreadNotFound", threadId: params.threadId },
    };
  }

  const space = await deps.spaceRepository.findById(thread.spaceId);
  if (space?.fixedMember) {
    return {
      ok: false,
      error: { kind: "FixedMember", spaceId: thread.spaceId },
    };
  }

  const alreadyFollowing = await deps.threadFollowRepository.exists(
    params.threadId,
    params.userId,
  );
  if (alreadyFollowing) {
    return {
      ok: false,
      error: {
        kind: "AlreadyFollowing",
        threadId: params.threadId,
        userId: params.userId,
      },
    };
  }

  const threadFollow = ThreadFollowEntity.create({
    threadId: params.threadId,
    userId: params.userId,
  });

  await deps.threadFollowRepository.save(threadFollow);

  return { ok: true, value: undefined };
}

/**
 * Unfollow a thread.
 *
 * 1. Verify thread existence
 * 2. Check space fixedMember setting (if true, follow changes are forbidden)
 * 3. Check that the user is currently following
 * 4. Delete follow relationship
 */
export async function unfollow(
  deps: ThreadFollowServiceDeps,
  params: {
    readonly threadId: ThreadIdType;
    readonly userId: UserId;
  },
): Promise<DomainResult<void, ThreadFollowError>> {
  const thread = await deps.threadRepository.findById(params.threadId);
  if (!thread) {
    return {
      ok: false,
      error: { kind: "ThreadNotFound", threadId: params.threadId },
    };
  }

  const space = await deps.spaceRepository.findById(thread.spaceId);
  if (space?.fixedMember) {
    return {
      ok: false,
      error: { kind: "FixedMember", spaceId: thread.spaceId },
    };
  }

  const isFollowing = await deps.threadFollowRepository.exists(
    params.threadId,
    params.userId,
  );
  if (!isFollowing) {
    return {
      ok: false,
      error: {
        kind: "NotFollowing",
        threadId: params.threadId,
        userId: params.userId,
      },
    };
  }

  await deps.threadFollowRepository.delete(params.threadId, params.userId);

  return { ok: true, value: undefined };
}
