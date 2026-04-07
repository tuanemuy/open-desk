import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError } from "../error";
import { createRecord } from "./createRecord";
import { reuseRecord } from "./reuseRecord";

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
        ["text_field", { type: "SINGLE_LINE_TEXT", value: "Hello" }],
      ]),
      creatorId: "user-1",
    },
  });
}

describe("reuseRecord", () => {
  it("should return copied field values (not saved)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const r = await seedRecord(container);
    const result = await reuseRecord({
      container,
      headers: headers(),
      input: { appId: "app-1", recordId: r.recordId, creatorId: "user-1" },
    });
    expect(result.fieldValues).toBeDefined();
  });

  it("should throw RecordNotFoundError when record does not exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      reuseRecord({
        container,
        headers: headers(),
        input: {
          appId: "app-1",
          recordId: "non-existent",
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
