import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "../error";
import { createRecord } from "./createRecord";
import { restoreRecord } from "./restoreRecord";

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

describe("restoreRecord", () => {
  it("should throw RecordNotFoundError when record does not exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      restoreRecord({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: "non-existent",
          version: 1,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent version", async () => {
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
    await expect(
      restoreRecord({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: r.recordId,
          version: 999,
          modifierId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
