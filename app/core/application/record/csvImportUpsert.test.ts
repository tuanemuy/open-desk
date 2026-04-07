import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { CsvImportJob } from "@/core/domain/record/entity";
import { csvImportUpsert } from "./csvImportUpsert";

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
  fileName: "test.csv",
  fileContent: new ArrayBuffer(100),
  fileSize: 100,
  encoding: "UTF8",
  delimiter: "COMMA",
  errorHandling: "STOP",
  fieldMappings: [
    { appFieldCode: "field_a", fileColumn: "A", dateFormat: null },
  ],
  updateKey: "field_a",
  creatorId: "user-1",
};

describe("csvImportUpsert", () => {
  it("should create an upsert import job", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    vi.spyOn(container.csvImportService, "processImport").mockImplementation(
      async (job) => CsvImportJob.complete(job, 10, 0),
    );
    const result = await csvImportUpsert({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.jobId).toBeDefined();
  });

  it("should throw UpdateKeyRequired when updateKey is empty", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    await expect(
      csvImportUpsert({
        container,
        headers: headers(),
        input: { ...baseInput, updateKey: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
