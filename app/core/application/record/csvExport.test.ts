import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { csvExport } from "./csvExport";

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
  encoding: "UTF8",
  delimiter: "COMMA",
  includeHeader: true,
  exportFields: ["field_a"],
  creatorId: "user-1",
};

describe("csvExport", () => {
  it("should create an export job", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await csvExport({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.jobId).toBeDefined();
  });

  it("should throw NoFieldsSelectedError for empty exportFields", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      csvExport({
        container,
        headers: headers(),
        input: { ...baseInput, exportFields: [] },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should create job with includeHeader=false", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await csvExport({
      container,
      headers: headers(),
      input: { ...baseInput, includeHeader: false },
    });
    expect(result.jobId).toBeDefined();
  });

  it("should create job with includeComments=true", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await csvExport({
      container,
      headers: headers(),
      input: { ...baseInput, includeComments: true },
    });
    expect(result.jobId).toBeDefined();
  });

  it("should create job with SHIFT_JIS encoding and TAB delimiter", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const result = await csvExport({
      container,
      headers: headers(),
      input: { ...baseInput, encoding: "SHIFT_JIS", delimiter: "TAB" },
    });
    expect(result.jobId).toBeDefined();
  });
});
