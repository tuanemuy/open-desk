import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ForbiddenError, NotFoundError } from "../error";
import { createRecord } from "./createRecord";
import { deleteComment } from "./deleteComment";
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
async function seedRecordAndComment(
  container: ReturnType<typeof getContainer>,
  creatorId = "user-1",
) {
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
    input: { appId: "app-1", recordId: r.recordId, text: "Comment", creatorId },
  });
  return { recordId: r.recordId, commentId: c.commentId };
}

describe("deleteComment", () => {
  it("should delete own comment", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const { recordId, commentId } = await seedRecordAndComment(container);
    await deleteComment({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId, commentId, requesterId: "user-1" },
    });
  });

  it("should throw ForbiddenError when deleting another user's comment", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedUser(container.db, "user-2");
    await seedApp(container.db, { id: "app-1" });
    const { recordId, commentId } = await seedRecordAndComment(
      container,
      "user-2",
    );
    await expect(
      deleteComment({
        container,
        headers: headers(),
        input: { appId: "app-1", recordId, commentId, requesterId: "user-1" },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError when comment does not exist", async () => {
    const container = getContainer();
    await expect(
      deleteComment({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: "r-1",
          commentId: "non-existent",
          requesterId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when deleting already deleted comment", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const { recordId, commentId } = await seedRecordAndComment(container);
    await deleteComment({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId, commentId, requesterId: "user-1" },
    });
    await expect(
      deleteComment({
        container,
        headers: headers(),
        input: { appId: "app-1", recordId, commentId, requesterId: "user-1" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
