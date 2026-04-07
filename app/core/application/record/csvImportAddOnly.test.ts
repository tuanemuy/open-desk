import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { CsvImportJob } from "@/core/domain/record/entity";
import { csvImportAddOnly } from "./csvImportAddOnly";

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
  creatorId: "user-1",
};

function mockCsvImport(container: ReturnType<typeof getContainer>) {
  vi.spyOn(container.csvImportService, "processImport").mockImplementation(
    async (job) => CsvImportJob.complete(job, 10, 0),
  );
}

describe("csvImportAddOnly", () => {
  it("should create an import job", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    mockCsvImport(container);
    const result = await csvImportAddOnly({
      container,
      headers: headers(),
      input: baseInput,
    });
    expect(result.jobId).toBeDefined();
  });

  it("should create job with SHIFT_JIS encoding", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    mockCsvImport(container);
    const result = await csvImportAddOnly({
      container,
      headers: headers(),
      input: { ...baseInput, encoding: "SHIFT_JIS" },
    });
    expect(result.jobId).toBeDefined();
  });

  it("should create job with TAB delimiter", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    mockCsvImport(container);
    const result = await csvImportAddOnly({
      container,
      headers: headers(),
      input: { ...baseInput, delimiter: "TAB" },
    });
    expect(result.jobId).toBeDefined();
  });

  it("should create job with CONTINUE error handling", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    mockCsvImport(container);
    const result = await csvImportAddOnly({
      container,
      headers: headers(),
      input: { ...baseInput, errorHandling: "CONTINUE" },
    });
    expect(result.jobId).toBeDefined();
  });
});
