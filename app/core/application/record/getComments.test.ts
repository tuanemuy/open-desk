import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "../error";
import { createRecord } from "./createRecord";
import { getComments } from "./getComments";
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

describe("getComments", () => {
  it("should return comments for a record", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
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
    await postComment({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        text: "C1",
        creatorId: "user-1",
      },
    });
    await postComment({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        recordId: r.recordId,
        text: "C2",
        creatorId: "user-1",
      },
    });
    const result = await getComments({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId: r.recordId },
    });
    expect(result.comments.length).toBeGreaterThanOrEqual(2);
  });

  it("should return empty when no comments", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
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
    const result = await getComments({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId: r.recordId },
    });
    expect(result.comments).toHaveLength(0);
    expect(result.older).toBe(false);
    expect(result.newer).toBe(false);
  });

  it("should throw RecordNotFoundError when record does not exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      getComments({
        container,
        headers: headers(),
        input: { appId: "app-1", recordId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
