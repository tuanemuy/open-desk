import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { CoverImage } from "@/core/domain/space/valueObject";
import { addRelatedLink } from "./addRelatedLink";
import { createSpace } from "./createSpace";
import { createThread } from "./createThread";
import { deleteRelatedLink } from "./deleteRelatedLink";
import { deleteSpace } from "./deleteSpace";
import { deleteThread } from "./deleteThread";
import { deleteThreadComment } from "./deleteThreadComment";
import { followThread } from "./followThread";
import { getSpace } from "./getSpace";
import { leaveSpace } from "./leaveSpace";
import { listMembers } from "./listMembers";
import { listRelatedLinks } from "./listRelatedLinks";
import { listSpaceUsage } from "./listSpaceUsage";
import { postThreadComment } from "./postThreadComment";
import { toggleCommentLike } from "./toggleCommentLike";
import { unfollowThread } from "./unfollowThread";
import { updateAnnouncement } from "./updateAnnouncement";
import { updateThread } from "./updateThread";

const headers = createMockHeaders();

// ============================================
// Test Data Helpers
// ============================================

async function createUser(
  db: ReturnType<typeof setupTestContainer> extends () => infer C
    ? C extends { db: infer D }
      ? D
      : never
    : never,
  opts: { loginName: string; displayName?: string; email?: string },
) {
  const [user] = await db
    .insert(schema.users)
    .values({
      loginName: opts.loginName,
      displayName: opts.displayName ?? opts.loginName,
      email: opts.email ?? `${opts.loginName}@test.com`,
      passwordHash: "test-hash",
    })
    .returning();
  return user;
}

async function createSystemPermission(
  db: Parameters<typeof createUser>[0],
  opts: {
    entityType: string;
    entityCode: string;
    systemAdmin?: boolean;
    spaceCreate?: boolean;
    guestSpaceCreate?: boolean;
  },
) {
  const [perm] = await db
    .insert(schema.systemPermissions)
    .values({
      entityType: opts.entityType,
      entityCode: opts.entityCode,
      systemAdmin: opts.systemAdmin ?? false,
      spaceCreate: opts.spaceCreate ?? false,
      guestSpaceCreate: opts.guestSpaceCreate ?? false,
    })
    .returning();
  return perm;
}

const defaultCoverImage: CoverImage = {
  type: "PRESET",
  key: "default",
  fileKey: null,
  url: null,
};

async function setupSpaceWithAdmin(
  container: ReturnType<typeof setupTestContainer> extends () => infer C
    ? C
    : never,
) {
  const admin = await createUser(container.db, { loginName: "space-admin" });
  await createSystemPermission(container.db, {
    entityType: "USER",
    entityCode: admin.loginName,
    spaceCreate: true,
  });

  const space = await createSpace({
    container,
    headers,
    input: {
      operatorId: admin.id,
      name: "Test Space",
      isPrivate: false,
      useMultiThread: true,
      fixedMember: false,
      appCreationPermission: "EVERYONE",
      coverImage: defaultCoverImage,
      members: [
        {
          entity: {
            type: "USER",
            id: admin.id as UserId,
            code: admin.loginName,
          },
          isAdmin: true,
          includeSubs: false,
        },
      ],
    },
  });

  return { admin, space };
}

async function setupSpaceWithMembers(
  container: ReturnType<typeof setupTestContainer> extends () => infer C
    ? C
    : never,
) {
  const admin = await createUser(container.db, { loginName: "space-admin" });
  const member = await createUser(container.db, { loginName: "space-member" });
  await createSystemPermission(container.db, {
    entityType: "USER",
    entityCode: admin.loginName,
    spaceCreate: true,
  });

  const space = await createSpace({
    container,
    headers,
    input: {
      operatorId: admin.id,
      name: "Test Space",
      isPrivate: false,
      useMultiThread: true,
      fixedMember: false,
      appCreationPermission: "EVERYONE",
      coverImage: defaultCoverImage,
      members: [
        {
          entity: {
            type: "USER",
            id: admin.id as UserId,
            code: admin.loginName,
          },
          isAdmin: true,
          includeSubs: false,
        },
        {
          entity: {
            type: "USER",
            id: member.id as UserId,
            code: member.loginName,
          },
          isAdmin: false,
          includeSubs: false,
        },
      ],
    },
  });

  return { admin, member, space };
}

// ============================================
// Space Create
// ============================================

describe("createSpace", () => {
  const getContainer = setupTestContainer();

  it("should create a space with valid input", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      spaceCreate: true,
    });

    const result = await createSpace({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "My Space",
        isPrivate: false,
        useMultiThread: true,
        fixedMember: false,
        appCreationPermission: "EVERYONE",
        coverImage: defaultCoverImage,
        members: [
          {
            entity: {
              type: "USER",
              id: user.id as UserId,
              code: user.loginName,
            },
            isAdmin: true,
            includeSubs: false,
          },
        ],
      },
    });

    expect(result.spaceId).toBeDefined();
    expect(result.name).toBe("My Space");
    expect(result.defaultThreadId).toBeDefined();
  });

  it("should create private space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      spaceCreate: true,
    });

    const result = await createSpace({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "Private Space",
        isPrivate: true,
        useMultiThread: false,
        fixedMember: false,
        appCreationPermission: "EVERYONE",
        coverImage: defaultCoverImage,
        members: [
          {
            entity: {
              type: "USER",
              id: user.id as UserId,
              code: user.loginName,
            },
            isAdmin: true,
            includeSubs: false,
          },
        ],
      },
    });

    expect(result.isPrivate).toBe(true);
  });

  it("should throw ForbiddenError when operator lacks space creation permission", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      createSpace({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          name: "My Space",
          isPrivate: false,
          useMultiThread: false,
          fixedMember: false,
          appCreationPermission: "EVERYONE",
          coverImage: defaultCoverImage,
          members: [
            {
              entity: {
                type: "USER",
                id: user.id as UserId,
                code: user.loginName,
              },
              isAdmin: true,
              includeSubs: false,
            },
          ],
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BusinessRuleError for empty space name", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      spaceCreate: true,
    });

    await expect(
      createSpace({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          name: "",
          isPrivate: false,
          useMultiThread: false,
          fixedMember: false,
          appCreationPermission: "EVERYONE",
          coverImage: defaultCoverImage,
          members: [
            {
              entity: {
                type: "USER",
                id: user.id as UserId,
                code: user.loginName,
              },
              isAdmin: true,
              includeSubs: false,
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for name exceeding 128 characters", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      spaceCreate: true,
    });

    await expect(
      createSpace({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          name: "a".repeat(129),
          isPrivate: false,
          useMultiThread: false,
          fixedMember: false,
          appCreationPermission: "EVERYONE",
          coverImage: defaultCoverImage,
          members: [
            {
              entity: {
                type: "USER",
                id: user.id as UserId,
                code: user.loginName,
              },
              isAdmin: true,
              includeSubs: false,
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed with 128-character name (boundary)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      spaceCreate: true,
    });

    const result = await createSpace({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "a".repeat(128),
        isPrivate: false,
        useMultiThread: false,
        fixedMember: false,
        appCreationPermission: "EVERYONE",
        coverImage: defaultCoverImage,
        members: [
          {
            entity: {
              type: "USER",
              id: user.id as UserId,
              code: user.loginName,
            },
            isAdmin: true,
            includeSubs: false,
          },
        ],
      },
    });

    expect(result.spaceId).toBeDefined();
  });

  it("should throw error when no admin member is specified", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      spaceCreate: true,
    });

    await expect(
      createSpace({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          name: "No Admin",
          isPrivate: false,
          useMultiThread: false,
          fixedMember: false,
          appCreationPermission: "EVERYONE",
          coverImage: defaultCoverImage,
          members: [
            {
              entity: {
                type: "USER",
                id: user.id as UserId,
                code: user.loginName,
              },
              isAdmin: false,
              includeSubs: false,
            },
          ],
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw error when members is empty", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      spaceCreate: true,
    });

    await expect(
      createSpace({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          name: "No Members",
          isPrivate: false,
          useMultiThread: false,
          fixedMember: false,
          appCreationPermission: "EVERYONE",
          coverImage: defaultCoverImage,
          members: [],
        },
      }),
    ).rejects.toThrow();
  });
});

// ============================================
// Space Get
// ============================================

describe("getSpace", () => {
  const getContainer = setupTestContainer();

  it("should return space details for public space", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await getSpace({
      container: c,
      headers,
      input: { operatorId: admin.id, spaceId: space.spaceId },
    });

    expect(result.spaceId).toBe(space.spaceId);
    expect(result.name).toBe("Test Space");
  });

  it("should throw NotFoundError for non-existent space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      getSpace({
        container: c,
        headers,
        input: { operatorId: user.id, spaceId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-member accesses private space", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "space-admin" });
    const outsider = await createUser(c.db, { loginName: "outsider" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      spaceCreate: true,
    });

    const space = await createSpace({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        name: "Private Space",
        isPrivate: true,
        useMultiThread: false,
        fixedMember: false,
        appCreationPermission: "EVERYONE",
        coverImage: defaultCoverImage,
        members: [
          {
            entity: {
              type: "USER",
              id: admin.id as UserId,
              code: admin.loginName,
            },
            isAdmin: true,
            includeSubs: false,
          },
        ],
      },
    });

    await expect(
      getSpace({
        container: c,
        headers,
        input: { operatorId: outsider.id, spaceId: space.spaceId },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Space Delete
// ============================================

describe("deleteSpace", () => {
  const getContainer = setupTestContainer();

  it("should delete space when operator is admin", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await deleteSpace({
      container: c,
      headers,
      input: { operatorId: admin.id, spaceId: space.spaceId },
    });

    await expect(
      getSpace({
        container: c,
        headers,
        input: { operatorId: admin.id, spaceId: space.spaceId },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      deleteSpace({
        container: c,
        headers,
        input: { operatorId: user.id, spaceId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-admin tries to delete", async () => {
    const c = getContainer();
    const { member, space } = await setupSpaceWithMembers(c);

    await expect(
      deleteSpace({
        container: c,
        headers,
        input: { operatorId: member.id, spaceId: space.spaceId },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Space Leave
// ============================================

describe("leaveSpace", () => {
  const getContainer = setupTestContainer();

  it("should allow general member to leave", async () => {
    const c = getContainer();
    const { member, space } = await setupSpaceWithMembers(c);

    await leaveSpace({
      container: c,
      headers,
      input: { operatorId: member.id, spaceId: space.spaceId },
    });
  });

  it("should throw NotFoundError for non-existent space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      leaveSpace({
        container: c,
        headers,
        input: { operatorId: user.id, spaceId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw error when non-member tries to leave", async () => {
    const c = getContainer();
    const outsider = await createUser(c.db, { loginName: "outsider" });
    const { space } = await setupSpaceWithAdmin(c);

    await expect(
      leaveSpace({
        container: c,
        headers,
        input: { operatorId: outsider.id, spaceId: space.spaceId },
      }),
    ).rejects.toThrow();
  });
});

// ============================================
// Thread Create
// ============================================

describe("createThread", () => {
  const getContainer = setupTestContainer();

  it("should create thread in multi-thread space", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "New Thread",
      },
    });

    expect(result.threadId).toBeDefined();
    expect(result.title).toBe("New Thread");
    expect(result.spaceId).toBe(space.spaceId);
  });

  it("should create thread with body", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Thread with body",
        body: "Some body text",
      },
    });

    expect(result.body).toBe("Some body text");
  });

  it("should throw NotFoundError for non-existent space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      createThread({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          spaceId: "non-existent",
          title: "Thread",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ValidationError for single-thread space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: user.loginName,
      spaceCreate: true,
    });

    const space = await createSpace({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "Single Thread",
        isPrivate: false,
        useMultiThread: false,
        fixedMember: false,
        appCreationPermission: "EVERYONE",
        coverImage: defaultCoverImage,
        members: [
          {
            entity: {
              type: "USER",
              id: user.id as UserId,
              code: user.loginName,
            },
            isAdmin: true,
            includeSubs: false,
          },
        ],
      },
    });

    await expect(
      createThread({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          spaceId: space.spaceId,
          title: "New Thread",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ForbiddenError when non-member creates thread", async () => {
    const c = getContainer();
    const outsider = await createUser(c.db, { loginName: "outsider" });
    const { space } = await setupSpaceWithAdmin(c);

    await expect(
      createThread({
        container: c,
        headers,
        input: {
          operatorId: outsider.id,
          spaceId: space.spaceId,
          title: "Thread",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BusinessRuleError for empty title", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await expect(
      createThread({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          spaceId: space.spaceId,
          title: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for title exceeding 128 characters", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await expect(
      createThread({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          spaceId: space.spaceId,
          title: "a".repeat(129),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed with 128-character title (boundary)", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "a".repeat(128),
      },
    });

    expect(result.threadId).toBeDefined();
  });

  it("should succeed with 65535-character body (boundary)", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Thread",
        body: "a".repeat(65535),
      },
    });

    expect(result.threadId).toBeDefined();
  });

  it("should throw BusinessRuleError for body exceeding 65535 characters", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await expect(
      createThread({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          spaceId: space.spaceId,
          title: "Thread",
          body: "a".repeat(65536),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});

// ============================================
// Thread Delete
// ============================================

describe("deleteThread", () => {
  const getContainer = setupTestContainer();

  it("should delete non-default thread when admin", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const thread = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "To Delete",
      },
    });

    await deleteThread({
      container: c,
      headers,
      input: { operatorId: admin.id, threadId: thread.threadId },
    });
  });

  it("should throw NotFoundError for non-existent thread", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      deleteThread({
        container: c,
        headers,
        input: { operatorId: user.id, threadId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ValidationError for default thread", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await expect(
      deleteThread({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          threadId: space.defaultThreadId,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ForbiddenError when non-admin deletes", async () => {
    const c = getContainer();
    const { admin, member, space } = await setupSpaceWithMembers(c);
    const thread = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Thread",
      },
    });

    await expect(
      deleteThread({
        container: c,
        headers,
        input: { operatorId: member.id, threadId: thread.threadId },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Thread Update
// ============================================

describe("updateThread", () => {
  const getContainer = setupTestContainer();

  it("should update title when admin", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const thread = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Original",
      },
    });

    const result = await updateThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        threadId: thread.threadId,
        title: "Updated",
      },
    });

    expect(result.title).toBe("Updated");
  });

  it("should update body when admin", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const thread = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Thread",
      },
    });

    const result = await updateThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        threadId: thread.threadId,
        body: "New body",
      },
    });

    expect(result.body).toBe("New body");
  });

  it("should throw NotFoundError for non-existent thread", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      updateThread({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          threadId: "non-existent",
          title: "Updated",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError for non-admin non-creator", async () => {
    const c = getContainer();
    const { admin, member, space } = await setupSpaceWithMembers(c);
    const thread = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Thread",
      },
    });

    await expect(
      updateThread({
        container: c,
        headers,
        input: {
          operatorId: member.id,
          threadId: thread.threadId,
          title: "Updated",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BusinessRuleError for empty title", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const thread = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Thread",
      },
    });

    await expect(
      updateThread({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          threadId: thread.threadId,
          title: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for title exceeding 128 chars", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const thread = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Thread",
      },
    });

    await expect(
      updateThread({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          threadId: thread.threadId,
          title: "a".repeat(129),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should set body to null", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const thread = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Thread",
        body: "Original body",
      },
    });

    const result = await updateThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        threadId: thread.threadId,
        body: null,
      },
    });

    expect(result.body).toBeNull();
  });
});

// ============================================
// Comment Post
// ============================================

describe("postThreadComment", () => {
  const getContainer = setupTestContainer();

  it("should post comment with text", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await postThreadComment({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        threadId: space.defaultThreadId,
        text: "Hello world",
      },
    });

    expect(result.commentId).toBeDefined();
    expect(result.text).toBe("Hello world");
  });

  it("should throw NotFoundError for non-existent thread", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      postThreadComment({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          threadId: "non-existent",
          text: "Hello",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-member posts", async () => {
    const c = getContainer();
    const outsider = await createUser(c.db, { loginName: "outsider" });
    const { space } = await setupSpaceWithAdmin(c);

    await expect(
      postThreadComment({
        container: c,
        headers,
        input: {
          operatorId: outsider.id,
          threadId: space.defaultThreadId,
          text: "Hello",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BusinessRuleError for empty comment (no text, no files)", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await expect(
      postThreadComment({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          threadId: space.defaultThreadId,
          text: null,
          files: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});

// ============================================
// Comment Delete
// ============================================

describe("deleteThreadComment", () => {
  const getContainer = setupTestContainer();

  it("should delete comment when poster", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const comment = await postThreadComment({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        threadId: space.defaultThreadId,
        text: "To delete",
      },
    });

    await deleteThreadComment({
      container: c,
      headers,
      input: { operatorId: admin.id, commentId: comment.commentId },
    });
  });

  it("should throw NotFoundError for non-existent comment", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      deleteThreadComment({
        container: c,
        headers,
        input: { operatorId: user.id, commentId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-poster/non-admin deletes", async () => {
    const c = getContainer();
    const { admin, member, space } = await setupSpaceWithMembers(c);
    const comment = await postThreadComment({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        threadId: space.defaultThreadId,
        text: "Admin comment",
      },
    });

    await expect(
      deleteThreadComment({
        container: c,
        headers,
        input: { operatorId: member.id, commentId: comment.commentId },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Comment Like Toggle
// ============================================

describe("toggleCommentLike", () => {
  const getContainer = setupTestContainer();

  it("should like comment when not liked", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const comment = await postThreadComment({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        threadId: space.defaultThreadId,
        text: "Likeable",
      },
    });

    const result = await toggleCommentLike({
      container: c,
      headers,
      input: { operatorId: admin.id, commentId: comment.commentId },
    });

    expect(result.liked).toBe(true);
  });

  it("should unlike comment when already liked", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const comment = await postThreadComment({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        threadId: space.defaultThreadId,
        text: "Likeable",
      },
    });

    await toggleCommentLike({
      container: c,
      headers,
      input: { operatorId: admin.id, commentId: comment.commentId },
    });

    const result = await toggleCommentLike({
      container: c,
      headers,
      input: { operatorId: admin.id, commentId: comment.commentId },
    });

    expect(result.liked).toBe(false);
  });

  it("should throw NotFoundError for non-existent comment", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      toggleCommentLike({
        container: c,
        headers,
        input: { operatorId: user.id, commentId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ============================================
// Thread Follow
// ============================================

describe("followThread", () => {
  const getContainer = setupTestContainer();

  it("should throw NotFoundError for non-existent thread", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      followThread({
        container: c,
        headers,
        input: { operatorId: user.id, threadId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-member follows", async () => {
    const c = getContainer();
    const outsider = await createUser(c.db, { loginName: "outsider" });
    const { admin, space } = await setupSpaceWithAdmin(c);
    const thread = await createThread({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Thread",
      },
    });

    await expect(
      followThread({
        container: c,
        headers,
        input: { operatorId: outsider.id, threadId: thread.threadId },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Thread Unfollow
// ============================================

describe("unfollowThread", () => {
  const getContainer = setupTestContainer();

  it("should throw NotFoundError for non-existent thread", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      unfollowThread({
        container: c,
        headers,
        input: { operatorId: user.id, threadId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ============================================
// Member List
// ============================================

describe("listMembers", () => {
  const getContainer = setupTestContainer();

  it("should return member list for public space", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await listMembers({
      container: c,
      headers,
      input: { operatorId: admin.id, spaceId: space.spaceId },
    });

    expect(result.members.length).toBeGreaterThanOrEqual(1);
  });

  it("should throw NotFoundError for non-existent space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      listMembers({
        container: c,
        headers,
        input: { operatorId: user.id, spaceId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-member accesses private space", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "admin" });
    const outsider = await createUser(c.db, { loginName: "outsider" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      spaceCreate: true,
    });

    const space = await createSpace({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        name: "Private",
        isPrivate: true,
        useMultiThread: false,
        fixedMember: false,
        appCreationPermission: "EVERYONE",
        coverImage: defaultCoverImage,
        members: [
          {
            entity: {
              type: "USER",
              id: admin.id as UserId,
              code: admin.loginName,
            },
            isAdmin: true,
            includeSubs: false,
          },
        ],
      },
    });

    await expect(
      listMembers({
        container: c,
        headers,
        input: { operatorId: outsider.id, spaceId: space.spaceId },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Related Link Add
// ============================================

describe("addRelatedLink", () => {
  const getContainer = setupTestContainer();

  it("should add related link as admin", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await addRelatedLink({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Link Title",
        url: "https://example.com",
      },
    });

    expect(result.linkId).toBeDefined();
    expect(result.title).toBe("Link Title");
    expect(result.url).toBe("https://example.com");
  });

  it("should throw NotFoundError for non-existent space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      addRelatedLink({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          spaceId: "non-existent",
          title: "Link",
          url: "https://example.com",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-admin adds", async () => {
    const c = getContainer();
    const { member, space } = await setupSpaceWithMembers(c);

    await expect(
      addRelatedLink({
        container: c,
        headers,
        input: {
          operatorId: member.id,
          spaceId: space.spaceId,
          title: "Link",
          url: "https://example.com",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BusinessRuleError for empty title", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await expect(
      addRelatedLink({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          spaceId: space.spaceId,
          title: "",
          url: "https://example.com",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for empty url", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await expect(
      addRelatedLink({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          spaceId: space.spaceId,
          title: "Link",
          url: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for invalid url", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await expect(
      addRelatedLink({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          spaceId: space.spaceId,
          title: "Link",
          url: "not-a-url",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});

// ============================================
// Related Link Delete
// ============================================

describe("deleteRelatedLink", () => {
  const getContainer = setupTestContainer();

  it("should delete related link as admin", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    const link = await addRelatedLink({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Link",
        url: "https://example.com",
      },
    });

    await deleteRelatedLink({
      container: c,
      headers,
      input: { operatorId: admin.id, linkId: link.linkId },
    });
  });

  it("should throw NotFoundError for non-existent link", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      deleteRelatedLink({
        container: c,
        headers,
        input: { operatorId: user.id, linkId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ============================================
// Related Link List
// ============================================

describe("listRelatedLinks", () => {
  const getContainer = setupTestContainer();

  it("should return related links for public space", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);
    await addRelatedLink({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        title: "Link 1",
        url: "https://example1.com",
      },
    });

    const result = await listRelatedLinks({
      container: c,
      headers,
      input: { operatorId: admin.id, spaceId: space.spaceId },
    });

    expect(result.links.length).toBe(1);
  });

  it("should return empty array when no links exist", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await listRelatedLinks({
      container: c,
      headers,
      input: { operatorId: admin.id, spaceId: space.spaceId },
    });

    expect(result.links.length).toBe(0);
  });

  it("should throw NotFoundError for non-existent space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      listRelatedLinks({
        container: c,
        headers,
        input: { operatorId: user.id, spaceId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ============================================
// Announcement Update
// ============================================

describe("updateAnnouncement", () => {
  const getContainer = setupTestContainer();

  it("should update announcement in multi-thread space", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await updateAnnouncement({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        body: "New announcement",
      },
    });

    expect(result.body).toBe("New announcement");
    expect(result.spaceId).toBe(space.spaceId);
  });

  it("should throw NotFoundError for non-existent space", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      updateAnnouncement({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          spaceId: "non-existent",
          body: "Announcement",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-admin updates", async () => {
    const c = getContainer();
    const { member, space } = await setupSpaceWithMembers(c);

    await expect(
      updateAnnouncement({
        container: c,
        headers,
        input: {
          operatorId: member.id,
          spaceId: space.spaceId,
          body: "Announcement",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should allow empty body", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await updateAnnouncement({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        body: "",
      },
    });

    expect(result.body).toBe("");
  });

  it("should succeed with 65535-character body (boundary)", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    const result = await updateAnnouncement({
      container: c,
      headers,
      input: {
        operatorId: admin.id,
        spaceId: space.spaceId,
        body: "a".repeat(65535),
      },
    });

    expect(result.body.length).toBe(65535);
  });

  it("should throw BusinessRuleError for body exceeding 65535 characters", async () => {
    const c = getContainer();
    const { admin, space } = await setupSpaceWithAdmin(c);

    await expect(
      updateAnnouncement({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          spaceId: space.spaceId,
          body: "a".repeat(65536),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});

// ============================================
// Space Usage List
// ============================================

describe("listSpaceUsage", () => {
  const getContainer = setupTestContainer();

  it("should return space usage list when system admin", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });

    const result = await listSpaceUsage({
      container: c,
      headers,
      input: { operatorId: admin.id },
    });

    expect(result.spaces).toBeDefined();
    expect(typeof result.totalCount).toBe("number");
  });

  it("should throw ForbiddenError when non-admin accesses", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "normal-user" });

    await expect(
      listSpaceUsage({
        container: c,
        headers,
        input: { operatorId: user.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should return empty when no spaces exist", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
    });

    const result = await listSpaceUsage({
      container: c,
      headers,
      input: { operatorId: admin.id },
    });

    expect(result.spaces.length).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it("should support pagination", async () => {
    const c = getContainer();
    const admin = await createUser(c.db, { loginName: "sys-admin" });
    await createSystemPermission(c.db, {
      entityType: "USER",
      entityCode: admin.loginName,
      systemAdmin: true,
      spaceCreate: true,
    });

    for (let i = 0; i < 3; i++) {
      await createSpace({
        container: c,
        headers,
        input: {
          operatorId: admin.id,
          name: `Space ${i}`,
          isPrivate: false,
          useMultiThread: false,
          fixedMember: false,
          appCreationPermission: "EVERYONE",
          coverImage: defaultCoverImage,
          members: [
            {
              entity: {
                type: "USER",
                id: admin.id as UserId,
                code: admin.loginName,
              },
              isAdmin: true,
              includeSubs: false,
            },
          ],
        },
      });
    }

    const result = await listSpaceUsage({
      container: c,
      headers,
      input: { operatorId: admin.id, offset: 0, limit: 2 },
    });

    expect(result.spaces.length).toBe(2);
    expect(result.totalCount).toBe(3);
  });
});
