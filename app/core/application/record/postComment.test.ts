import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { createRecord } from "./createRecord";
import { postComment } from "./postComment";

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
async function seedRecord(
  container: ReturnType<typeof getContainer>,
  appId = "app-1",
) {
  vi.spyOn(
    container.recordValidationService,
    "validateFieldValues",
  ).mockResolvedValue();
  return createRecord({
    container,
    headers: headers(),
    input: {
      appId,
      fieldValues: new Map([
        ["f", { type: "SINGLE_LINE_TEXT" as const, value: "v" }],
      ]),
      creatorId: "user-1",
    },
  });
}

describe("postComment", () => {
  it("should post a comment with valid text", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    const result = await postComment({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        text: "Hello",
        creatorId: "user-1",
      },
    });
    expect(result.commentId).toBeDefined();
  });

  it("should post a comment without mentions", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    const result = await postComment({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        text: "No mentions",
        mentions: [],
        creatorId: "user-1",
      },
    });
    expect(result.commentId).toBeDefined();
  });

  it("should post a comment with 10 mentions (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    const mentions = Array.from({ length: 10 }, (_, i) => ({
      type: "USER" as const,
      code: `user-${i}`,
    }));
    const result = await postComment({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        text: "With mentions",
        mentions,
        creatorId: "user-1",
      },
    });
    expect(result.commentId).toBeDefined();
  });

  it("should throw TooManyMentionsError for 11 mentions", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    const mentions = Array.from({ length: 11 }, (_, i) => ({
      type: "USER" as const,
      code: `user-${i}`,
    }));
    await expect(
      postComment({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: r.recordId,
          text: "Too many",
          mentions,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw CommentTextEmptyError for empty text", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    await expect(
      postComment({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: r.recordId,
          text: "",
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should accept 1-character text (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    const result = await postComment({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        text: "a",
        creatorId: "user-1",
      },
    });
    expect(result.commentId).toBeDefined();
  });

  it("should accept 65535-character text (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    const result = await postComment({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        text: "a".repeat(65535),
        creatorId: "user-1",
      },
    });
    expect(result.commentId).toBeDefined();
  });

  it("should throw CommentTextTooLongError for 65536-character text", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    await expect(
      postComment({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: r.recordId,
          text: "a".repeat(65536),
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw RecordNotFoundError when record does not exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      postComment({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: "non-existent",
          text: "Hi",
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
