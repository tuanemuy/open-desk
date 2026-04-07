import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { manageCustomization } from "./manageCustomization";

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

const baseInput = {
  appId: "app-1",
  scope: "ALL_USERS" as const,
  desktopJs: null,
  desktopCss: null,
  mobileJs: null,
  mobileCss: null,
  revision: 0,
  modifierId: "user-1",
};

describe("manageCustomization", () => {
  it("should set customization with scope=ALL_USERS", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await manageCustomization({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.appId).toBe("app-1");
    expect(result.scope).toBe("ALL_USERS");
  });

  it("should set customization with scope=ADMIN_ONLY", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await manageCustomization({
      container,
      headers: headers(),
      input: { ...baseInput, scope: "ADMIN_ONLY" },
    });
    expect(result.scope).toBe("ADMIN_ONLY");
  });

  it("should set customization with scope=NONE", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await manageCustomization({
      container,
      headers: headers(),
      input: { ...baseInput, scope: "NONE" },
    });
    expect(result.scope).toBe("NONE");
  });

  it("should set desktopJs with URL type", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await manageCustomization({
      container,
      headers: headers(),
      input: {
        ...baseInput,
        desktopJs: [
          {
            type: "URL" as const,
            url: "https://example.com/app.js",
            fileKey: null,
            name: null,
          },
        ],
      },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      manageCustomization({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "bad" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "DELETED" });
    await expect(
      manageCustomization({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError on revision conflict", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await manageCustomization({
      container,
      headers: headers(),
      input: baseInput,
    });
    await expect(
      manageCustomization({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
