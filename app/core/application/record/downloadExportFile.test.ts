import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError, ValidationError } from "../error";
import { csvExport } from "./csvExport";
import { downloadExportFile } from "./downloadExportFile";

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

describe("downloadExportFile", () => {
  it("should throw NotFoundError when job does not exist", async () => {
    const container = getContainer();
    await expect(
      downloadExportFile({
        container,
        headers: headers(),
        input: { jobId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ValidationError when job is not completed (PROCESSING status)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1" });
    const job = await csvExport({
      container,
      headers: headers(),
      input: {
        appId: "app-1",
        encoding: "UTF8",
        delimiter: "COMMA",
        includeHeader: true,
        exportFields: ["f"],
        creatorId: "user-1",
      },
    });
    // Job starts in PROCESSING status
    await expect(
      downloadExportFile({
        container,
        headers: headers(),
        input: { jobId: job.jobId },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
