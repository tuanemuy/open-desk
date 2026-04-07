import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "../error";
import { createCursor } from "./createCursor";
import { getCursorRecords } from "./getCursorRecords";

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

describe("getCursorRecords", () => {
  it("should throw CursorNotFoundError when cursor does not exist", async () => {
    const container = getContainer();
    await expect(
      getCursorRecords({
        container,
        headers: headers(),
        input: { cursorId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw CursorNotFoundError for mismatched cursor ID", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      getCursorRecords({
        container,
        headers: headers(),
        input: { cursorId: "mismatched-id" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
