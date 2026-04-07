import { describe, expect, it, vi } from "vitest";
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
import { bulkMarkAsRead } from "./bulkMarkAsRead";
import { createFilter } from "./createFilter";
import { deleteFilter } from "./deleteFilter";
import { generateAppConditionNotifications } from "./generateAppConditionNotifications";
import { generateMentionNotifications } from "./generateMentionNotifications";
import { generateRecordConditionNotifications } from "./generateRecordConditionNotifications";
import { generateReminderNotifications } from "./generateReminderNotifications";
import { generateSpaceNotifications } from "./generateSpaceNotifications";
import { getNotification } from "./getNotification";
import { getPreference } from "./getPreference";
import { getUnreadCount } from "./getUnreadCount";
import { initializePreference } from "./initializePreference";
import { listFilters } from "./listFilters";
import { listNotifications } from "./listNotifications";
import { markAsRead } from "./markAsRead";
import { markAsUnread } from "./markAsUnread";
import { toggleReadLater } from "./toggleReadLater";
import { updateDesktopPreference } from "./updateDesktopPreference";
import { updateEmailPreference } from "./updateEmailPreference";
import { updateFilter } from "./updateFilter";

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

async function createNotification(
  db: Parameters<typeof createUser>[0],
  opts: {
    recipientId: string;
    type?: string;
    sourceType?: string;
    sourceId?: string;
    senderId?: string | null;
    title?: string;
    content?: string;
    isRead?: boolean;
    isReadLater?: boolean;
    createdAt?: Date;
  },
) {
  const [notification] = await db
    .insert(schema.notifications)
    .values({
      recipientId: opts.recipientId,
      type: opts.type ?? "MENTION",
      sourceType: opts.sourceType ?? "COMMENT",
      sourceId: opts.sourceId ?? "source-1",
      senderId: opts.senderId ?? null,
      title: opts.title ?? "Test notification",
      content: opts.content ?? "Test content",
      isRead: opts.isRead ?? false,
      isReadLater: opts.isReadLater ?? false,
      createdAt: opts.createdAt ?? new Date(),
    })
    .returning();
  return notification;
}

async function createNotificationPreference(
  db: Parameters<typeof createUser>[0],
  opts: {
    userId: string;
    emailEnabled?: boolean;
    emailScope?: string;
    emailFormat?: string;
    desktopEnabled?: boolean;
  },
) {
  const [pref] = await db
    .insert(schema.notificationPreferences)
    .values({
      userId: opts.userId,
      emailEnabled: opts.emailEnabled ?? true,
      emailScope: opts.emailScope ?? "MENTION_ONLY",
      emailFormat: opts.emailFormat ?? "HTML",
      desktopEnabled: opts.desktopEnabled ?? false,
    })
    .returning();
  return pref;
}

async function createNotificationFilter(
  db: Parameters<typeof createUser>[0],
  opts: {
    userId: string;
    name: string;
    isBuiltIn?: boolean;
    notificationType?: string;
    locationMode?: string;
  },
) {
  const [filter] = await db
    .insert(schema.notificationFilters)
    .values({
      userId: opts.userId,
      name: opts.name,
      isBuiltIn: opts.isBuiltIn ?? false,
      notificationType: opts.notificationType ?? "ALL",
      locationMode: opts.locationMode ?? "ALL",
    })
    .returning();
  return filter;
}

// ============================================
// Preference Init
// ============================================

describe("initializePreference", () => {
  const getContainer = setupTestContainer();

  it("should create default preference and built-in filters for new user", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "new-user" });

    const result = await initializePreference({
      container: c,
      headers,
      input: { userId: user.id },
    });

    expect(result.emailEnabled).toBe(true);
    expect(result.emailScope).toBe("MENTION_ONLY");
    expect(result.emailFormat).toBe("HTML");
    expect(result.desktopEnabled).toBe(false);
  });

  it("should return existing preference when already initialized (idempotent)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "existing-user" });
    await createNotificationPreference(c.db, {
      userId: user.id,
      emailEnabled: false,
    });

    const result = await initializePreference({
      container: c,
      headers,
      input: { userId: user.id },
    });

    expect(result.emailEnabled).toBe(false);
  });

  it("should create built-in filters on first initialization", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "new-user" });

    await initializePreference({
      container: c,
      headers,
      input: { userId: user.id },
    });

    const filters = await listFilters({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(filters.builtInFilters.length).toBe(3);
  });
});

// ============================================
// Preference Get
// ============================================

describe("getPreference", () => {
  const getContainer = setupTestContainer();

  it("should return preference when it exists", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, { userId: user.id });

    const result = await getPreference({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.emailEnabled).toBe(true);
    expect(result.emailScope).toBe("MENTION_ONLY");
    expect(result.emailFormat).toBe("HTML");
    expect(result.desktopEnabled).toBe(false);
  });

  it("should throw NotFoundError when preference does not exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      getPreference({
        container: c,
        headers,
        input: { operatorId: user.id },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ============================================
// Desktop Preference Update
// ============================================

describe("updateDesktopPreference", () => {
  const getContainer = setupTestContainer();

  it("should enable desktop notification", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, {
      userId: user.id,
      desktopEnabled: false,
    });

    const result = await updateDesktopPreference({
      container: c,
      headers,
      input: { operatorId: user.id, desktopEnabled: true },
    });

    expect(result.desktopEnabled).toBe(true);
  });

  it("should disable desktop notification", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, {
      userId: user.id,
      desktopEnabled: true,
    });

    const result = await updateDesktopPreference({
      container: c,
      headers,
      input: { operatorId: user.id, desktopEnabled: false },
    });

    expect(result.desktopEnabled).toBe(false);
  });

  it("should be idempotent (setting same value)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, {
      userId: user.id,
      desktopEnabled: true,
    });

    const result = await updateDesktopPreference({
      container: c,
      headers,
      input: { operatorId: user.id, desktopEnabled: true },
    });

    expect(result.desktopEnabled).toBe(true);
  });

  it("should throw NotFoundError when preference does not exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      updateDesktopPreference({
        container: c,
        headers,
        input: { operatorId: user.id, desktopEnabled: true },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

// ============================================
// Email Preference Update
// ============================================

describe("updateEmailPreference", () => {
  const getContainer = setupTestContainer();

  it("should enable email notification", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, {
      userId: user.id,
      emailEnabled: false,
    });

    const result = await updateEmailPreference({
      container: c,
      headers,
      input: { operatorId: user.id, emailEnabled: true },
    });

    expect(result.emailEnabled).toBe(true);
  });

  it("should change email scope when email is enabled", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, {
      userId: user.id,
      emailEnabled: true,
    });

    const result = await updateEmailPreference({
      container: c,
      headers,
      input: { operatorId: user.id, emailScope: "ALL" },
    });

    expect(result.emailScope).toBe("ALL");
  });

  it("should change email format when email is enabled", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, {
      userId: user.id,
      emailEnabled: true,
    });

    const result = await updateEmailPreference({
      container: c,
      headers,
      input: { operatorId: user.id, emailFormat: "TEXT" },
    });

    expect(result.emailFormat).toBe("TEXT");
  });

  it("should throw NotFoundError when preference does not exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      updateEmailPreference({
        container: c,
        headers,
        input: { operatorId: user.id, emailEnabled: true },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when changing scope with email disabled", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, {
      userId: user.id,
      emailEnabled: false,
    });

    await expect(
      updateEmailPreference({
        container: c,
        headers,
        input: { operatorId: user.id, emailScope: "ALL" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when changing format with email disabled", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, {
      userId: user.id,
      emailEnabled: false,
    });

    await expect(
      updateEmailPreference({
        container: c,
        headers,
        input: { operatorId: user.id, emailFormat: "TEXT" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should return unchanged when no fields specified", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotificationPreference(c.db, { userId: user.id });

    const result = await updateEmailPreference({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.emailEnabled).toBe(true);
    expect(result.emailScope).toBe("MENTION_ONLY");
  });
});

// ============================================
// Custom Filter Create
// ============================================

describe("createFilter", () => {
  const getContainer = setupTestContainer();

  it("should create a custom filter with valid input", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await createFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "My Filter",
        notificationType: "ALL",
        locationMode: "ALL",
        locationConditions: [],
        senderConditions: [],
      },
    });

    expect(result.filterId).toBeDefined();
    expect(result.name).toBe("My Filter");
    expect(result.notificationType).toBe("ALL");
  });

  it("should create MENTION type filter", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await createFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "Mentions Only",
        notificationType: "MENTION",
        locationMode: "ALL",
        locationConditions: [],
        senderConditions: [],
      },
    });

    expect(result.notificationType).toBe("MENTION");
  });

  it("should create filter with INCLUDE location mode", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await createFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "Include Filter",
        notificationType: "ALL",
        locationMode: "INCLUDE",
        locationConditions: [{ locationType: "APP", locationId: "app-1" }],
        senderConditions: [],
      },
    });

    expect(result.locationMode).toBe("INCLUDE");
  });

  it("should create filter with EXCLUDE location mode", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await createFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "Exclude Filter",
        notificationType: "ALL",
        locationMode: "EXCLUDE",
        locationConditions: [{ locationType: "SPACE", locationId: "space-1" }],
        senderConditions: [],
      },
    });

    expect(result.locationMode).toBe("EXCLUDE");
  });

  it("should create filter with sender conditions", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await createFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "Sender Filter",
        notificationType: "ALL",
        locationMode: "ALL",
        locationConditions: [],
        senderConditions: [{ senderType: "USER", senderId: "user-123" }],
      },
    });

    expect(result.senderConditions.length).toBe(1);
  });

  it("should throw BusinessRuleError for empty name", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      createFilter({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          name: "",
          notificationType: "ALL",
          locationMode: "ALL",
          locationConditions: [],
          senderConditions: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for name exceeding 100 characters", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      createFilter({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          name: "a".repeat(101),
          notificationType: "ALL",
          locationMode: "ALL",
          locationConditions: [],
          senderConditions: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed with name of exactly 100 characters (boundary)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await createFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "a".repeat(100),
        notificationType: "ALL",
        locationMode: "ALL",
        locationConditions: [],
        senderConditions: [],
      },
    });

    expect(result.name).toBe("a".repeat(100));
  });

  it("should throw BusinessRuleError for INCLUDE mode with empty locationConditions", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      createFilter({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          name: "Bad Filter",
          notificationType: "ALL",
          locationMode: "INCLUDE",
          locationConditions: [],
          senderConditions: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for EXCLUDE mode with empty locationConditions", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      createFilter({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          name: "Bad Filter",
          notificationType: "ALL",
          locationMode: "EXCLUDE",
          locationConditions: [],
          senderConditions: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed with ALL mode and empty locationConditions", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await createFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "All Filter",
        notificationType: "ALL",
        locationMode: "ALL",
        locationConditions: [],
        senderConditions: [],
      },
    });

    expect(result.locationMode).toBe("ALL");
  });
});

// ============================================
// Custom Filter Update
// ============================================

describe("updateFilter", () => {
  const getContainer = setupTestContainer();

  it("should update filter name", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const filter = await createNotificationFilter(c.db, {
      userId: user.id,
      name: "Original",
    });

    const result = await updateFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        filterId: filter.id,
        name: "Updated Name",
      },
    });

    expect(result.name).toBe("Updated Name");
  });

  it("should throw NotFoundError for non-existent filter", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      updateFilter({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          filterId: "non-existent",
          name: "Updated",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when operator does not own filter", async () => {
    const c = getContainer();
    const owner = await createUser(c.db, { loginName: "owner" });
    const other = await createUser(c.db, { loginName: "other" });
    const filter = await createNotificationFilter(c.db, {
      userId: owner.id,
      name: "Owner Filter",
    });

    await expect(
      updateFilter({
        container: c,
        headers,
        input: {
          operatorId: other.id,
          filterId: filter.id,
          name: "Updated",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ValidationError when trying to modify built-in filter", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const filter = await createNotificationFilter(c.db, {
      userId: user.id,
      name: "MENTION",
      isBuiltIn: true,
    });

    await expect(
      updateFilter({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          filterId: filter.id,
          name: "Updated",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw BusinessRuleError for empty name", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const filter = await createNotificationFilter(c.db, {
      userId: user.id,
      name: "Original",
    });

    await expect(
      updateFilter({
        container: c,
        headers,
        input: { operatorId: user.id, filterId: filter.id, name: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed with 100-character name (boundary)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const filter = await createNotificationFilter(c.db, {
      userId: user.id,
      name: "Original",
    });

    const result = await updateFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        filterId: filter.id,
        name: "a".repeat(100),
      },
    });

    expect(result.name).toBe("a".repeat(100));
  });

  it("should throw BusinessRuleError for 101-character name (boundary)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const filter = await createNotificationFilter(c.db, {
      userId: user.id,
      name: "Original",
    });

    await expect(
      updateFilter({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          filterId: filter.id,
          name: "a".repeat(101),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});

// ============================================
// Custom Filter Delete
// ============================================

describe("deleteFilter", () => {
  const getContainer = setupTestContainer();

  it("should delete owned custom filter", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const filter = await createNotificationFilter(c.db, {
      userId: user.id,
      name: "My Filter",
    });

    await deleteFilter({
      container: c,
      headers,
      input: { operatorId: user.id, filterId: filter.id },
    });

    // Filter should be gone
    await expect(
      updateFilter({
        container: c,
        headers,
        input: {
          operatorId: user.id,
          filterId: filter.id,
          name: "Should Fail",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent filter", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      deleteFilter({
        container: c,
        headers,
        input: { operatorId: user.id, filterId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when deleting another user's filter", async () => {
    const c = getContainer();
    const owner = await createUser(c.db, { loginName: "owner" });
    const other = await createUser(c.db, { loginName: "other" });
    const filter = await createNotificationFilter(c.db, {
      userId: owner.id,
      name: "Owner Filter",
    });

    await expect(
      deleteFilter({
        container: c,
        headers,
        input: { operatorId: other.id, filterId: filter.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw ValidationError when deleting built-in filter", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const filter = await createNotificationFilter(c.db, {
      userId: user.id,
      name: "MENTION",
      isBuiltIn: true,
    });

    await expect(
      deleteFilter({
        container: c,
        headers,
        input: { operatorId: user.id, filterId: filter.id },
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ============================================
// Filter List
// ============================================

describe("listFilters", () => {
  const getContainer = setupTestContainer();

  it("should return built-in and custom filters", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await initializePreference({
      container: c,
      headers,
      input: { userId: user.id },
    });
    await createFilter({
      container: c,
      headers,
      input: {
        operatorId: user.id,
        name: "Custom",
        notificationType: "ALL",
        locationMode: "ALL",
        locationConditions: [],
        senderConditions: [],
      },
    });

    const result = await listFilters({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.builtInFilters.length).toBe(3);
    expect(result.customFilters.length).toBe(1);
  });

  it("should return only built-in filters when no custom filters exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await initializePreference({
      container: c,
      headers,
      input: { userId: user.id },
    });

    const result = await listFilters({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.builtInFilters.length).toBe(3);
    expect(result.customFilters.length).toBe(0);
  });

  it("should not include other user's filters", async () => {
    const c = getContainer();
    const user1 = await createUser(c.db, { loginName: "user1" });
    const user2 = await createUser(c.db, { loginName: "user2" });
    await initializePreference({
      container: c,
      headers,
      input: { userId: user1.id },
    });
    await initializePreference({
      container: c,
      headers,
      input: { userId: user2.id },
    });
    await createFilter({
      container: c,
      headers,
      input: {
        operatorId: user2.id,
        name: "User2 Filter",
        notificationType: "ALL",
        locationMode: "ALL",
        locationConditions: [],
        senderConditions: [],
      },
    });

    const result = await listFilters({
      container: c,
      headers,
      input: { operatorId: user1.id },
    });

    expect(result.customFilters.length).toBe(0);
  });
});

// ============================================
// Mention Notification Generate
// ============================================

describe("generateMentionNotifications", () => {
  const getContainer = setupTestContainer();

  it("should generate notifications for mentioned users", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const mentioned1 = await createUser(c.db, { loginName: "mentioned1" });
    const mentioned2 = await createUser(c.db, { loginName: "mentioned2" });

    const result = await generateMentionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "COMMENT",
        sourceId: "comment-1",
        mentionedUserIds: [mentioned1.id, mentioned2.id],
        title: "New mention",
        content: "You were mentioned",
      },
    });

    expect(result.notifications.length).toBe(2);
  });

  it("should exclude sender from notifications", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });

    const result = await generateMentionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "COMMENT",
        sourceId: "comment-1",
        mentionedUserIds: [sender.id],
        title: "Self mention",
        content: "Self mention content",
      },
    });

    expect(result.notifications.length).toBe(0);
  });

  it("should throw BusinessRuleError for empty title", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const mentioned = await createUser(c.db, { loginName: "mentioned" });

    await expect(
      generateMentionNotifications({
        container: c,
        headers,
        input: {
          senderId: sender.id,
          sourceType: "COMMENT",
          sourceId: "comment-1",
          mentionedUserIds: [mentioned.id],
          title: "",
          content: "content",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed with 256-character title (boundary)", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const mentioned = await createUser(c.db, { loginName: "mentioned" });

    const result = await generateMentionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "COMMENT",
        sourceId: "comment-1",
        mentionedUserIds: [mentioned.id],
        title: "a".repeat(256),
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(1);
  });

  it("should throw BusinessRuleError for 257-character title (boundary)", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const mentioned = await createUser(c.db, { loginName: "mentioned" });

    await expect(
      generateMentionNotifications({
        container: c,
        headers,
        input: {
          senderId: sender.id,
          sourceType: "COMMENT",
          sourceId: "comment-1",
          mentionedUserIds: [mentioned.id],
          title: "a".repeat(257),
          content: "content",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed with 1024-character content (boundary)", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const mentioned = await createUser(c.db, { loginName: "mentioned" });

    const result = await generateMentionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "COMMENT",
        sourceId: "comment-1",
        mentionedUserIds: [mentioned.id],
        title: "Test",
        content: "a".repeat(1024),
      },
    });

    expect(result.notifications.length).toBe(1);
  });

  it("should throw BusinessRuleError for 1025-character content (boundary)", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const mentioned = await createUser(c.db, { loginName: "mentioned" });

    await expect(
      generateMentionNotifications({
        container: c,
        headers,
        input: {
          senderId: sender.id,
          sourceType: "COMMENT",
          sourceId: "comment-1",
          mentionedUserIds: [mentioned.id],
          title: "Test",
          content: "a".repeat(1025),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});

// ============================================
// App Condition Notification Generate
// ============================================

describe("generateAppConditionNotifications", () => {
  const getContainer = setupTestContainer();

  it("should generate notifications for recipients", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const recipient1 = await createUser(c.db, { loginName: "recipient1" });
    const recipient2 = await createUser(c.db, { loginName: "recipient2" });

    const result = await generateAppConditionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "RECORD",
        sourceId: "record-1",
        recipientIds: [recipient1.id, recipient2.id],
        title: "App condition",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(2);
  });

  it("should exclude sender from notifications", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });

    const result = await generateAppConditionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "RECORD",
        sourceId: "record-1",
        recipientIds: [sender.id],
        title: "Self",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(0);
  });

  it("should exclude mentioned users from recipients", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const user1 = await createUser(c.db, { loginName: "user1" });
    const user2 = await createUser(c.db, { loginName: "user2" });

    const result = await generateAppConditionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "RECORD",
        sourceId: "record-1",
        recipientIds: [user1.id, user2.id],
        mentionedUserIds: [user1.id],
        title: "App condition",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(1);
    expect(result.notifications[0].recipientId).toBe(user2.id);
  });

  it("should return 0 notifications when all recipients are mentioned", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const user1 = await createUser(c.db, { loginName: "user1" });

    const result = await generateAppConditionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "RECORD",
        sourceId: "record-1",
        recipientIds: [user1.id],
        mentionedUserIds: [user1.id],
        title: "All excluded",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(0);
  });
});

// ============================================
// Reminder Notification Generate
// ============================================

describe("generateReminderNotifications", () => {
  const getContainer = setupTestContainer();

  it("should generate reminder notifications with null senderId", async () => {
    const c = getContainer();
    const user1 = await createUser(c.db, { loginName: "user1" });
    const user2 = await createUser(c.db, { loginName: "user2" });

    const result = await generateReminderNotifications({
      container: c,
      headers,
      input: {
        sourceType: "RECORD",
        sourceId: "record-1",
        recipientIds: [user1.id, user2.id],
        title: "Reminder",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(2);
  });

  it("should generate 1 notification for single recipient (boundary)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await generateReminderNotifications({
      container: c,
      headers,
      input: {
        sourceType: "RECORD",
        sourceId: "record-1",
        recipientIds: [user.id],
        title: "Reminder",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(1);
  });

  it("should throw BusinessRuleError for empty title", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      generateReminderNotifications({
        container: c,
        headers,
        input: {
          sourceType: "RECORD",
          sourceId: "record-1",
          recipientIds: [user.id],
          title: "",
          content: "content",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});

// ============================================
// Space Notification Generate
// ============================================

describe("generateSpaceNotifications", () => {
  const getContainer = setupTestContainer();

  it("should generate notifications for space followers", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const follower = await createUser(c.db, { loginName: "follower" });

    const result = await generateSpaceNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "THREAD",
        sourceId: "thread-1",
        recipientIds: [follower.id],
        title: "New thread",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(1);
  });

  it("should exclude sender from notifications", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });

    const result = await generateSpaceNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "THREAD",
        sourceId: "thread-1",
        recipientIds: [sender.id],
        title: "Self",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(0);
  });

  it("should throw BusinessRuleError for title exceeding 256 characters", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const follower = await createUser(c.db, { loginName: "follower" });

    await expect(
      generateSpaceNotifications({
        container: c,
        headers,
        input: {
          senderId: sender.id,
          sourceType: "THREAD",
          sourceId: "thread-1",
          recipientIds: [follower.id],
          title: "a".repeat(257),
          content: "content",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});

// ============================================
// Record Condition Notification Generate
// ============================================

describe("generateRecordConditionNotifications", () => {
  const getContainer = setupTestContainer();

  it("should generate record condition notifications", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });
    const recipient = await createUser(c.db, { loginName: "recipient" });

    const result = await generateRecordConditionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "RECORD",
        sourceId: "record-1",
        recipientIds: [recipient.id],
        title: "Record condition",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(1);
  });

  it("should exclude sender from notifications", async () => {
    const c = getContainer();
    const sender = await createUser(c.db, { loginName: "sender" });

    const result = await generateRecordConditionNotifications({
      container: c,
      headers,
      input: {
        senderId: sender.id,
        sourceType: "RECORD",
        sourceId: "record-1",
        recipientIds: [sender.id],
        title: "Self",
        content: "content",
      },
    });

    expect(result.notifications.length).toBe(0);
  });
});

// ============================================
// Notification Get
// ============================================

describe("getNotification", () => {
  const getContainer = setupTestContainer();

  it("should return notification detail when recipient accesses it", async () => {
    const c = getContainer();
    vi.spyOn(c.notificationSourceResolver, "resolve").mockResolvedValue(null);
    const user = await createUser(c.db, { loginName: "user1" });
    const notification = await createNotification(c.db, {
      recipientId: user.id,
      title: "Test title",
    });

    const result = await getNotification({
      container: c,
      headers,
      input: { operatorId: user.id, notificationId: notification.id },
    });

    expect(result.notificationId).toBe(notification.id);
    expect(result.title).toBe("Test title");
  });

  it("should throw NotFoundError for non-existent notification", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      getNotification({
        container: c,
        headers,
        input: { operatorId: user.id, notificationId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-recipient accesses it", async () => {
    const c = getContainer();
    const owner = await createUser(c.db, { loginName: "owner" });
    const other = await createUser(c.db, { loginName: "other" });
    const notification = await createNotification(c.db, {
      recipientId: owner.id,
    });

    await expect(
      getNotification({
        container: c,
        headers,
        input: { operatorId: other.id, notificationId: notification.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Notification List
// ============================================

describe("listNotifications", () => {
  const getContainer = setupTestContainer();

  it("should return notifications for the operator", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotification(c.db, { recipientId: user.id, title: "Notif 1" });
    await createNotification(c.db, { recipientId: user.id, title: "Notif 2" });

    const result = await listNotifications({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.notifications.length).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it("should filter by isRead=true", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: true,
      title: "Read",
    });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
      title: "Unread",
    });

    const result = await listNotifications({
      container: c,
      headers,
      input: { operatorId: user.id, isRead: true },
    });

    expect(result.notifications.every((n) => n.isRead)).toBe(true);
  });

  it("should filter by isRead=false", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: true,
      title: "Read",
    });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
      title: "Unread",
    });

    const result = await listNotifications({
      container: c,
      headers,
      input: { operatorId: user.id, isRead: false },
    });

    expect(result.notifications.every((n) => !n.isRead)).toBe(true);
  });

  it("should support pagination with offset and limit", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    for (let i = 0; i < 5; i++) {
      await createNotification(c.db, {
        recipientId: user.id,
        title: `Notif ${i}`,
      });
    }

    const result = await listNotifications({
      container: c,
      headers,
      input: { operatorId: user.id, offset: 0, limit: 2 },
    });

    expect(result.notifications.length).toBe(2);
    expect(result.totalCount).toBe(5);
  });

  it("should return empty when no notifications exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await listNotifications({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.notifications.length).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it("should throw NotFoundError for non-existent filterId", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      listNotifications({
        container: c,
        headers,
        input: { operatorId: user.id, filterId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError for other user's filterId", async () => {
    const c = getContainer();
    const user1 = await createUser(c.db, { loginName: "user1" });
    const user2 = await createUser(c.db, { loginName: "user2" });
    const filter = await createNotificationFilter(c.db, {
      userId: user2.id,
      name: "User2 Filter",
    });

    await expect(
      listNotifications({
        container: c,
        headers,
        input: { operatorId: user1.id, filterId: filter.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Mark As Read
// ============================================

describe("markAsRead", () => {
  const getContainer = setupTestContainer();

  it("should mark unread notification as read", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const notification = await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
    });

    const result = await markAsRead({
      container: c,
      headers,
      input: { operatorId: user.id, notificationId: notification.id },
    });

    expect(result.isRead).toBe(true);
  });

  it("should be idempotent (already read)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const notification = await createNotification(c.db, {
      recipientId: user.id,
      isRead: true,
    });

    const result = await markAsRead({
      container: c,
      headers,
      input: { operatorId: user.id, notificationId: notification.id },
    });

    expect(result.isRead).toBe(true);
  });

  it("should throw NotFoundError for non-existent notification", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      markAsRead({
        container: c,
        headers,
        input: { operatorId: user.id, notificationId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-recipient marks as read", async () => {
    const c = getContainer();
    const owner = await createUser(c.db, { loginName: "owner" });
    const other = await createUser(c.db, { loginName: "other" });
    const notification = await createNotification(c.db, {
      recipientId: owner.id,
    });

    await expect(
      markAsRead({
        container: c,
        headers,
        input: { operatorId: other.id, notificationId: notification.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Mark As Unread
// ============================================

describe("markAsUnread", () => {
  const getContainer = setupTestContainer();

  it("should mark read notification as unread", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const notification = await createNotification(c.db, {
      recipientId: user.id,
      isRead: true,
    });

    const result = await markAsUnread({
      container: c,
      headers,
      input: { operatorId: user.id, notificationId: notification.id },
    });

    expect(result.isRead).toBe(false);
  });

  it("should be idempotent (already unread)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const notification = await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
    });

    const result = await markAsUnread({
      container: c,
      headers,
      input: { operatorId: user.id, notificationId: notification.id },
    });

    expect(result.isRead).toBe(false);
  });

  it("should throw NotFoundError for non-existent notification", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      markAsUnread({
        container: c,
        headers,
        input: { operatorId: user.id, notificationId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-recipient marks as unread", async () => {
    const c = getContainer();
    const owner = await createUser(c.db, { loginName: "owner" });
    const other = await createUser(c.db, { loginName: "other" });
    const notification = await createNotification(c.db, {
      recipientId: owner.id,
    });

    await expect(
      markAsUnread({
        container: c,
        headers,
        input: { operatorId: other.id, notificationId: notification.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Toggle Read Later
// ============================================

describe("toggleReadLater", () => {
  const getContainer = setupTestContainer();

  it("should toggle from false to true", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const notification = await createNotification(c.db, {
      recipientId: user.id,
      isReadLater: false,
    });

    const result = await toggleReadLater({
      container: c,
      headers,
      input: { operatorId: user.id, notificationId: notification.id },
    });

    expect(result.isReadLater).toBe(true);
  });

  it("should toggle from true to false", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const notification = await createNotification(c.db, {
      recipientId: user.id,
      isReadLater: true,
    });

    const result = await toggleReadLater({
      container: c,
      headers,
      input: { operatorId: user.id, notificationId: notification.id },
    });

    expect(result.isReadLater).toBe(false);
  });

  it("should not affect read status", async () => {
    const c = getContainer();
    vi.spyOn(c.notificationSourceResolver, "resolve").mockResolvedValue(null);
    const user = await createUser(c.db, { loginName: "user1" });
    const notification = await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
      isReadLater: false,
    });

    await toggleReadLater({
      container: c,
      headers,
      input: { operatorId: user.id, notificationId: notification.id },
    });

    const detail = await getNotification({
      container: c,
      headers,
      input: { operatorId: user.id, notificationId: notification.id },
    });

    expect(detail.isRead).toBe(false);
    expect(detail.isReadLater).toBe(true);
  });

  it("should throw NotFoundError for non-existent notification", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    await expect(
      toggleReadLater({
        container: c,
        headers,
        input: { operatorId: user.id, notificationId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when non-recipient toggles", async () => {
    const c = getContainer();
    const owner = await createUser(c.db, { loginName: "owner" });
    const other = await createUser(c.db, { loginName: "other" });
    const notification = await createNotification(c.db, {
      recipientId: owner.id,
    });

    await expect(
      toggleReadLater({
        container: c,
        headers,
        input: { operatorId: other.id, notificationId: notification.id },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ============================================
// Bulk Mark As Read
// ============================================

describe("bulkMarkAsRead", () => {
  const getContainer = setupTestContainer();

  it("should mark specified notifications as read", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    const n1 = await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
    });
    const n2 = await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
    });

    const result = await bulkMarkAsRead({
      container: c,
      headers,
      input: { operatorId: user.id, notificationIds: [n1.id, n2.id] },
    });

    expect(result.readCount).toBe(2);
  });

  it("should mark all unread notifications when ids are omitted", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
    });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
    });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: true,
    });

    const result = await bulkMarkAsRead({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.readCount).toBe(2);
  });

  it("should return readCount=0 when no unread notifications exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await bulkMarkAsRead({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.readCount).toBe(0);
  });
});

// ============================================
// Unread Count
// ============================================

describe("getUnreadCount", () => {
  const getContainer = setupTestContainer();

  it("should return correct unread count", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
    });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
    });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: true,
    });

    const result = await getUnreadCount({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.unreadCount).toBe(2);
  });

  it("should return 0 when no unread notifications exist", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });

    const result = await getUnreadCount({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.unreadCount).toBe(0);
  });

  it("should return 0 when all notifications are read", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: true,
    });

    const result = await getUnreadCount({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.unreadCount).toBe(0);
  });

  it("should return 1 for single unread notification (boundary)", async () => {
    const c = getContainer();
    const user = await createUser(c.db, { loginName: "user1" });
    await createNotification(c.db, {
      recipientId: user.id,
      isRead: false,
    });

    const result = await getUnreadCount({
      container: c,
      headers,
      input: { operatorId: user.id },
    });

    expect(result.unreadCount).toBe(1);
  });
});
