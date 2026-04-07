import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ValidationError } from "../error";
import { deployApps } from "./deployApps";

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
    name: "Test App",
    status: "PREVIEW",
    revision: 1,
    creatorId: "user-1",
    modifierId: "user-1",
    ...overrides,
  });
}

function mockDeploySuccess(
  container: ReturnType<typeof getContainer>,
  appIds: string[],
) {
  vi.spyOn(
    container.appDeploymentService,
    "validateForDeployment",
  ).mockResolvedValue({ isValid: true, errors: [] });
  vi.spyOn(container.appDeploymentService, "deployBatch").mockResolvedValue();
  vi.spyOn(container.appDeploymentService, "getDeployStatus").mockResolvedValue(
    appIds.map((id) => ({ appId: id, status: "SUCCESS" as const })),
  );
}

describe("deployApps", () => {
  it("should deploy a single PREVIEW app", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "PREVIEW" });
    mockDeploySuccess(container, ["app-1"]);
    const result = await deployApps({
      container,
      headers: headers(),
      input: { appIds: ["app-1"], executorId: "user-1" },
    });
    expect(result.results).toHaveLength(1);
  });

  it("should deploy multiple apps at once", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "PREVIEW" });
    await seedApp(container.db, { id: "app-2", status: "PREVIEW" });
    mockDeploySuccess(container, ["app-1", "app-2"]);
    const result = await deployApps({
      container,
      headers: headers(),
      input: { appIds: ["app-1", "app-2"], executorId: "user-1" },
    });
    expect(result.results).toHaveLength(2);
  });

  it("should throw ValidationError for empty appIds", async () => {
    const container = getContainer();
    await expect(
      deployApps({
        container,
        headers: headers(),
        input: { appIds: [], executorId: "user-1" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError for 301+ appIds", async () => {
    const container = getContainer();
    await expect(
      deployApps({
        container,
        headers: headers(),
        input: {
          appIds: Array.from({ length: 301 }, (_, i) => `app-${i}`),
          executorId: "user-1",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should accept exactly 300 appIds (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    const ids = Array.from({ length: 300 }, (_, i) => `app-${i}`);
    for (let i = 0; i < 300; i += 100) {
      const batch = ids.slice(i, i + 100).map((id) => ({
        id,
        name: id,
        status: "PREVIEW" as const,
        revision: 1,
        creatorId: "user-1",
        modifierId: "user-1",
      }));
      await container.db.insert(schema.apps).values(batch);
    }
    mockDeploySuccess(container, ids);
    const result = await deployApps({
      container,
      headers: headers(),
      input: { appIds: ids, executorId: "user-1" },
    });
    expect(result.results).toHaveLength(300);
  });

  it("should accept exactly 1 appId (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "PREVIEW" });
    mockDeploySuccess(container, ["app-1"]);
    const result = await deployApps({
      container,
      headers: headers(),
      input: { appIds: ["app-1"], executorId: "user-1" },
    });
    expect(result.results).toHaveLength(1);
  });

  it("should return FAIL for apps that fail validation", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "PREVIEW" });
    await seedApp(container.db, { id: "app-2", status: "PREVIEW" });
    vi.spyOn(container.appDeploymentService, "validateForDeployment")
      .mockResolvedValueOnce({ isValid: true, errors: [] })
      .mockResolvedValueOnce({ isValid: false, errors: ["form error"] });
    vi.spyOn(container.appDeploymentService, "deployBatch").mockResolvedValue();
    vi.spyOn(
      container.appDeploymentService,
      "getDeployStatus",
    ).mockResolvedValue([{ appId: "app-1", status: "SUCCESS" as const }]);
    const result = await deployApps({
      container,
      headers: headers(),
      input: { appIds: ["app-1", "app-2"], executorId: "user-1" },
    });
    const failResult = result.results.find((r) => r.status === "FAIL");
    expect(failResult).toBeDefined();
  });
});
