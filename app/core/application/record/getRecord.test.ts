import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "../error";
import { createRecord } from "./createRecord";
import { getRecord } from "./getRecord";

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
      fieldValues: new Map([["f", { type: "SINGLE_LINE_TEXT", value: "v" }]]),
      creatorId: "user-1",
    },
  });
}

describe("getRecord", () => {
  it("should get a record by appId and recordId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const created = await seedRecord(container);
    const result = await getRecord({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId: created.recordId },
    });
    expect(result.record.recordId).toBe(created.recordId);
    expect(result.record.revision).toBe(1);
  });

  it("should throw RecordNotFoundError when record does not exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      getRecord({
        container,
        headers: headers(),
        input: { appId: "app-1", recordId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when record belongs to another app", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await seedApp(container.db, { id: "app-2" });
    const created = await seedRecord(container, "app-1");
    await expect(
      getRecord({
        container,
        headers: headers(),
        input: { appId: "app-2", recordId: created.recordId },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
