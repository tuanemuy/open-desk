import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { manageApiToken } from "./manageApiToken";

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
  tokenId: null as string | null,
  scopes: ["READ" as const],
  memo: "Test token",
  regenerate: false,
  executorId: "user-1",
};

describe("manageApiToken", () => {
  it("should create a new token", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await manageApiToken({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.tokenId).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.token).not.toBeNull();
  });

  it("should update scopes of an existing token (regenerate=false)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await manageApiToken({
      container,
      headers: headers(),
      input: baseInput,
    });
    const result = await manageApiToken({
      container,
      headers: headers(),
      input: {
        ...baseInput,
        tokenId: created.tokenId,
        scopes: ["WRITE" as const],
      },
    });
    expect(result.token).toBeNull();
  });

  it("should regenerate token", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await manageApiToken({
      container,
      headers: headers(),
      input: baseInput,
    });
    const result = await manageApiToken({
      container,
      headers: headers(),
      input: { ...baseInput, tokenId: created.tokenId, regenerate: true },
    });
    expect(result.token).toBeDefined();
    expect(result.token).not.toBeNull();
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      manageApiToken({
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
      manageApiToken({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for empty scopes", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      manageApiToken({
        container,
        headers: headers(),
        input: { ...baseInput, scopes: [] },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when token count reaches 20", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    for (let i = 0; i < 20; i++) {
      await manageApiToken({ container, headers: headers(), input: baseInput });
    }
    await expect(
      manageApiToken({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed when token count is 19 (boundary: just before limit)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    for (let i = 0; i < 19; i++) {
      await manageApiToken({ container, headers: headers(), input: baseInput });
    }
    const result = await manageApiToken({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.tokenId).toBeDefined();
  });

  it("should throw NotFoundError for non-existent tokenId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      manageApiToken({
        container,
        headers: headers(),
        input: { ...baseInput, tokenId: "bad" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should accept all scopes", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await manageApiToken({
      container,
      headers: headers(),
      input: {
        ...baseInput,
        scopes: ["READ", "WRITE", "UPDATE", "DELETE", "MANAGE_APP"],
      },
    });
    expect(result.tokenId).toBeDefined();
  });
});
