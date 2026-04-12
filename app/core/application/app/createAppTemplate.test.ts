import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createAppTemplate } from "./createAppTemplate";

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
  id = "app-1",
  creatorId = "user-1",
  overrides: { status?: string } = {},
) {
  await db.insert(schema.apps).values({
    id,
    name: `App ${id}`,
    status: overrides.status ?? "ACTIVE",
    revision: 1,
    creatorId,
    modifierId: creatorId,
  });
}

describe("createAppTemplate", () => {
  it("should create a template from an active app", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db);

    const result = await createAppTemplate({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        sourceAppId: "app-1",
        name: "My Template",
        description: "A test template",
      },
    });

    expect(result.templateId).toBeDefined();
    expect(result.name).toBe("My Template");
    expect(result.description).toBe("A test template");
    expect(result.sourceAppId).toBe("app-1");
    expect(result.creatorId).toBe("user-1");
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should create a template with null description", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db);

    const result = await createAppTemplate({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        sourceAppId: "app-1",
        name: "No Description",
        description: null,
      },
    });

    expect(result.description).toBeNull();
  });

  it("should create a template with 1-character name (lower boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db);

    const result = await createAppTemplate({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        sourceAppId: "app-1",
        name: "A",
      },
    });

    expect(result.name).toBe("A");
  });

  it("should create a template with 128-character name (upper boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db);

    const name = "a".repeat(128);
    const result = await createAppTemplate({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        sourceAppId: "app-1",
        name,
      },
    });

    expect(result.name).toBe(name);
  });

  it("should throw NotFoundError for non-existent source app", async () => {
    const container = getContainer();
    await seedUser(container.db);

    await expect(
      createAppTemplate({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          sourceAppId: "non-existent-app",
          name: "Template",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ValidationError when source app is DELETED", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, "deleted-app", "user-1", {
      status: "DELETED",
    });

    await expect(
      createAppTemplate({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          sourceAppId: "deleted-app",
          name: "Template",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw BusinessRuleError for empty name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db);

    await expect(
      createAppTemplate({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          sourceAppId: "app-1",
          name: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for name exceeding 128 characters", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db);

    await expect(
      createAppTemplate({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          sourceAppId: "app-1",
          name: "a".repeat(129),
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
