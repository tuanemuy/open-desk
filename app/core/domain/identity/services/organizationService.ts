import type { DomainResult } from "@/core/domain/common/result";
import type { Organization, User } from "@/core/domain/identity/entity";
import type { OrganizationRepository } from "@/core/domain/identity/ports/organizationRepository";
import type { UserRepository } from "@/core/domain/identity/ports/userRepository";
import type { OrganizationId as OrganizationIdType } from "@/core/domain/identity/valueObject";

// ============================================
// Error Types
// ============================================

export type OrganizationNotFoundError = {
  readonly kind: "OrganizationNotFound";
  readonly organizationId: OrganizationIdType;
};

export type CircularReferenceError = {
  readonly kind: "CircularReference";
  readonly organizationId: OrganizationIdType;
  readonly targetParentId: OrganizationIdType;
};

// ============================================
// Service Dependencies
// ============================================

export type OrganizationServiceDeps = {
  readonly organizationRepository: OrganizationRepository;
  readonly userRepository: UserRepository;
};

// ============================================
// Organization Service
// ============================================

/**
 * Get the ancestor organizations of the specified organization,
 * traversing up to the root.
 * Returns the list ordered from root to the immediate parent.
 */
export async function getAncestors(
  deps: Pick<OrganizationServiceDeps, "organizationRepository">,
  organizationId: OrganizationIdType,
): Promise<DomainResult<Organization[], OrganizationNotFoundError>> {
  const organization =
    await deps.organizationRepository.findById(organizationId);
  if (!organization) {
    return {
      ok: false,
      error: { kind: "OrganizationNotFound", organizationId },
    };
  }

  const ancestors: Organization[] = [];
  let current = organization;

  while (current.parentOrganizationId !== null) {
    const parent = await deps.organizationRepository.findById(
      current.parentOrganizationId,
    );
    if (!parent) {
      break;
    }
    ancestors.unshift(parent);
    current = parent;
  }

  return { ok: true, value: ancestors };
}

/**
 * Get all descendant organizations of the specified organization
 * using breadth-first traversal.
 */
export async function getDescendants(
  deps: Pick<OrganizationServiceDeps, "organizationRepository">,
  organizationId: OrganizationIdType,
): Promise<DomainResult<Organization[], OrganizationNotFoundError>> {
  const organization =
    await deps.organizationRepository.findById(organizationId);
  if (!organization) {
    return {
      ok: false,
      error: { kind: "OrganizationNotFound", organizationId },
    };
  }

  const descendants: Organization[] = [];
  const queue: OrganizationIdType[] = [organizationId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === undefined) break;
    const children =
      await deps.organizationRepository.findByParentId(currentId);

    for (const child of children) {
      descendants.push(child);
      queue.push(child.organizationId);
    }
  }

  return { ok: true, value: descendants };
}

/**
 * Get all users belonging to an organization,
 * optionally including users from sub-organizations.
 */
export async function getUsersInOrganization(
  deps: OrganizationServiceDeps,
  params: {
    organizationId: OrganizationIdType;
    includeSubOrganizations: boolean;
  },
): Promise<DomainResult<User[], OrganizationNotFoundError>> {
  const organization = await deps.organizationRepository.findById(
    params.organizationId,
  );
  if (!organization) {
    return {
      ok: false,
      error: {
        kind: "OrganizationNotFound",
        organizationId: params.organizationId,
      },
    };
  }

  const orgIds: OrganizationIdType[] = [params.organizationId];

  if (params.includeSubOrganizations) {
    const descendantsResult = await getDescendants(deps, params.organizationId);
    if (descendantsResult.ok) {
      for (const desc of descendantsResult.value) {
        orgIds.push(desc.organizationId);
      }
    }
  }

  const userSets = await Promise.all(
    orgIds.map((id) => deps.userRepository.findByOrganizationId(id)),
  );

  // Deduplicate users by userId
  const seenUserIds = new Set<string>();
  const uniqueUsers: User[] = [];

  for (const users of userSets) {
    for (const user of users) {
      if (!seenUserIds.has(user.userId)) {
        seenUserIds.add(user.userId);
        uniqueUsers.push(user);
      }
    }
  }

  return { ok: true, value: uniqueUsers };
}

/**
 * Validate that moving an organization to a new parent
 * does not create a circular reference in the tree.
 */
export async function validateMove(
  deps: Pick<OrganizationServiceDeps, "organizationRepository">,
  params: {
    organizationId: OrganizationIdType;
    newParentOrganizationId: OrganizationIdType | null;
  },
): Promise<
  DomainResult<void, CircularReferenceError | OrganizationNotFoundError>
> {
  // Moving to root is always valid
  if (params.newParentOrganizationId === null) {
    return { ok: true, value: undefined };
  }

  // Cannot set self as parent
  if (params.newParentOrganizationId === params.organizationId) {
    return {
      ok: false,
      error: {
        kind: "CircularReference",
        organizationId: params.organizationId,
        targetParentId: params.newParentOrganizationId,
      },
    };
  }

  // Verify the new parent exists
  const newParent = await deps.organizationRepository.findById(
    params.newParentOrganizationId,
  );
  if (!newParent) {
    return {
      ok: false,
      error: {
        kind: "OrganizationNotFound",
        organizationId: params.newParentOrganizationId,
      },
    };
  }

  // Traverse ancestors of the new parent to ensure the organization
  // being moved is not among them (which would create a cycle)
  let current: Organization | null = newParent;
  while (current !== null && current.parentOrganizationId !== null) {
    if (current.parentOrganizationId === params.organizationId) {
      return {
        ok: false,
        error: {
          kind: "CircularReference",
          organizationId: params.organizationId,
          targetParentId: params.newParentOrganizationId,
        },
      };
    }
    current = await deps.organizationRepository.findById(
      current.parentOrganizationId,
    );
  }

  return { ok: true, value: undefined };
}
