import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { configureWebhook } from "./configureWebhook";

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
  webhookId: null as string | null,
  url: "https://example.com/hook",
  description: "Test webhook",
  events: ["RECORD_CREATED" as const],
  isActive: true,
  executorId: "user-1",
};

describe("configureWebhook", () => {
  it("should create a new webhook with HTTPS URL", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await configureWebhook({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.webhookId).toBeDefined();
    expect(result.url).toBe("https://example.com/hook");
  });

  it("should update an existing webhook URL", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await configureWebhook({
      container,
      headers: headers(),
      input: baseInput,
    });
    const result = await configureWebhook({
      container,
      headers: headers(),
      input: {
        ...baseInput,
        webhookId: created.webhookId,
        url: "https://new.example.com/hook",
      },
    });
    expect(result.url).toBe("https://new.example.com/hook");
  });

  it("should disable a webhook", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await configureWebhook({
      container,
      headers: headers(),
      input: baseInput,
    });
    const result = await configureWebhook({
      container,
      headers: headers(),
      input: { ...baseInput, webhookId: created.webhookId, isActive: false },
    });
    expect(result.isActive).toBe(false);
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      configureWebhook({
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
      configureWebhook({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for HTTP (non-HTTPS) URL", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      configureWebhook({
        container,
        headers: headers(),
        input: { ...baseInput, url: "http://example.com/hook" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for empty events", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      configureWebhook({
        container,
        headers: headers(),
        input: { ...baseInput, events: [] },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when webhook count reaches 10", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    for (let i = 0; i < 10; i++) {
      await configureWebhook({
        container,
        headers: headers(),
        input: baseInput,
      });
    }
    await expect(
      configureWebhook({ container, headers: headers(), input: baseInput }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed when webhook count is 9 (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    for (let i = 0; i < 9; i++) {
      await configureWebhook({
        container,
        headers: headers(),
        input: baseInput,
      });
    }
    const result = await configureWebhook({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.webhookId).toBeDefined();
  });

  it("should throw NotFoundError for non-existent webhookId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      configureWebhook({
        container,
        headers: headers(),
        input: { ...baseInput, webhookId: "bad" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
