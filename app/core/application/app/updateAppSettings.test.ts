import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { ConflictError, NotFoundError } from "../error";
import { updateAppSettings } from "./updateAppSettings";

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
    status: "ACTIVE",
    revision: 1,
    creatorId: "user-1",
    modifierId: "user-1",
    ...overrides,
  });
}

const baseInput = {
  revision: 1,
  name: null,
  code: undefined as string | null | undefined,
  description: undefined as string | null | undefined,
  theme: null,
  icon: null,
  titleField: null,
  numberPrecision: null,
  firstMonthOfFiscalYear: null,
  featureFlags: null,
  modifierId: "user-1",
};

describe("updateAppSettings", () => {
  it("should update app name with correct revision", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", name: "New Name" },
    });
    expect(result.appId).toBe("app-1");
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should set app code (no duplicate)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", code: "uniqueCode1" },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should clear app code when set to null", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, {
      id: "app-1",
      status: "ACTIVE",
      revision: 1,
      code: "old-code",
    });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", code: null },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should set description", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", description: "App description" },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should clear description when set to null", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", description: null },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should update theme", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", theme: "RED" },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should update firstMonthOfFiscalYear to 4", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", firstMonthOfFiscalYear: 4 },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should throw NotFoundError for non-existent appId", async () => {
    const container = getContainer();
    await expect(
      updateAppSettings({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "non-existent" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when revision does not match", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 2 });
    await expect(
      updateAppSettings({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "app-1", revision: 1, name: "New" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, {
      id: "app-1",
      status: "DELETED",
      revision: 1,
    });
    await expect(
      updateAppSettings({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "app-1", name: "New" },
      }),
    ).rejects.toThrow();
  });

  it("should throw ConflictError when code is duplicate", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, {
      id: "app-1",
      status: "ACTIVE",
      revision: 1,
      code: "dupCode",
    });
    await seedApp(container.db, { id: "app-2", status: "ACTIVE", revision: 1 });
    await expect(
      updateAppSettings({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "app-2", code: "dupCode" },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw BusinessRuleError for empty name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    await expect(
      updateAppSettings({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "app-1", name: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for name with 65+ characters", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    await expect(
      updateAppSettings({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "app-1", name: "a".repeat(65) },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for description with 10001+ characters", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    await expect(
      updateAppSettings({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "app-1", description: "a".repeat(10001) },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should accept description with exactly 10000 characters (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", description: "a".repeat(10000) },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should throw BusinessRuleError for firstMonthOfFiscalYear 0", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    await expect(
      updateAppSettings({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "app-1", firstMonthOfFiscalYear: 0 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for firstMonthOfFiscalYear 13", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    await expect(
      updateAppSettings({
        container,
        headers: headers(),
        input: { ...baseInput, appId: "app-1", firstMonthOfFiscalYear: 13 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should accept firstMonthOfFiscalYear 1 (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", firstMonthOfFiscalYear: 1 },
    });
    expect(result.appId).toBe("app-1");
  });

  it("should accept firstMonthOfFiscalYear 12 (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "app-1", status: "ACTIVE", revision: 1 });
    const result = await updateAppSettings({
      container,
      headers: headers(),
      input: { ...baseInput, appId: "app-1", firstMonthOfFiscalYear: 12 },
    });
    expect(result.appId).toBe("app-1");
  });
});
