import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "../error";
import { createRecord } from "./createRecord";
import { likeComment } from "./likeComment";
import { postComment } from "./postComment";
import { unlikeComment } from "./unlikeComment";

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
async function seedCommentData(container: ReturnType<typeof getContainer>) {
  vi.spyOn(
    container.recordValidationService,
    "validateFieldValues",
  ).mockResolvedValue();
  const r = await createRecord({
    container,
    headers: headers(),
    input: {
      appId: "app-1",
      fieldValues: new Map([["f", { type: "SINGLE_LINE_TEXT", value: "v" }]]),
      creatorId: "user-1",
    },
  });
  const c = await postComment({
    container,
    headers: headers(),
    input: {
      appId: "app-1",
      recordId: r.recordId,
      text: "C",
      creatorId: "user-1",
    },
  });
  return { recordId: r.recordId, commentId: c.commentId };
}

describe("unlikeComment", () => {
  it("should unlike a liked comment", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const { recordId, commentId } = await seedCommentData(container);
    await likeComment({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId, commentId, userId: "user-1" },
    });
    await unlikeComment({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId, commentId, userId: "user-1" },
    });
  });

  it("should be idempotent (no-op if not liked)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const { recordId, commentId } = await seedCommentData(container);
    await unlikeComment({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId, commentId, userId: "user-1" },
    });
  });

  it("should throw NotFoundError when comment does not exist", async () => {
    const container = getContainer();
    await expect(
      unlikeComment({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: "r",
          commentId: "non-existent",
          userId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should be idempotent after double unlike", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const { recordId, commentId } = await seedCommentData(container);
    await likeComment({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId, commentId, userId: "user-1" },
    });
    await unlikeComment({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId, commentId, userId: "user-1" },
    });
    await unlikeComment({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId, commentId, userId: "user-1" },
    });
  });
});
