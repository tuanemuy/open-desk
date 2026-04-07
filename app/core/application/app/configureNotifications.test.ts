import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { configureNotifications } from "./configureNotifications";

const getContainer = setupTestContainer();
const headers = () => createMockHeaders();

async function seedUser(
  db: ReturnType<typeof getContainer>["db"],
  id = "user-1",
) {
  await db.insert(schema.users).values({
    id,
    loginName: `login-${id}`,
    displayName: `User ${id}`,
    email: `${id}@test.com`,
    passwordHash: "hash",
  });
}
async function seedApp(
  db: ReturnType<typeof getContainer>["db"],
  overrides: Partial<typeof schema.apps.$inferInsert> & { id: string },
) {
  await db.insert(schema.apps).values({
    name: "App",
    status: "ACTIVE",
    revision: 1,
    creatorId: "user-1",
    modifierId: "user-1",
    ...overrides,
  });
}

describe("configureNotifications", () => {
  it("should set general notifications", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await configureNotifications({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        generalNotifications: [
          {
            recipients: [
              { type: "CREATOR" as const, code: null, fieldCode: null },
            ],
            events: ["ADD_RECORD" as const],
            enableCommentTracking: false,
          },
        ],
        perRecordNotifications: null,
        reminderNotifications: null,
        revision: 0,
        modifierId: "user-1",
      },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should set per-record notifications", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await configureNotifications({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        generalNotifications: null,
        perRecordNotifications: [
          {
            filterCondition: 'field_a = "test"',
            recipients: [
              { type: "CREATOR" as const, code: null, fieldCode: null },
            ],
          },
        ],
        reminderNotifications: null,
        revision: 0,
        modifierId: "user-1",
      },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      configureNotifications({
        container,
        headers: headers(),
        input: {
          appId: "bad",
          generalNotifications: null,
          perRecordNotifications: null,
          reminderNotifications: null,
          revision: 0,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      configureNotifications({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          generalNotifications: null,
          perRecordNotifications: null,
          reminderNotifications: null,
          revision: 0,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError on revision conflict", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await configureNotifications({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        generalNotifications: [
          {
            recipients: [
              { type: "CREATOR" as const, code: null, fieldCode: null },
            ],
            events: ["ADD_RECORD" as const],
            enableCommentTracking: false,
          },
        ],
        perRecordNotifications: null,
        reminderNotifications: null,
        revision: 0,
        modifierId: "user-1",
      },
    });
    await expect(
      configureNotifications({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          generalNotifications: null,
          perRecordNotifications: null,
          reminderNotifications: null,
          revision: 0,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
