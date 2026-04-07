import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { App } from "@/core/domain/app/entity";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { createAppFromExisting } from "./createAppFromExisting";

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

function mockDuplicateApp(container: ReturnType<typeof getContainer>) {
  vi.spyOn(container.appCreationService, "duplicateApp").mockResolvedValue({
    app: App.create({
      name: "Dup App",
      creatorId: "user-1" as never,
      spaceId: null,
      threadId: null,
    }).entity,
    fields: [],
    formLayout: null,
    views: [],
    reports: [],
  });
}

describe("createAppFromExisting", () => {
  it("should duplicate a source app and create a PREVIEW app", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "source-app" });
    mockDuplicateApp(container);
    const result = await createAppFromExisting({
      container,
      headers: headers(),
      input: {
        sourceAppId: "source-app",
        name: "Copy App",
        spaceId: null,
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should duplicate an app into a specific space", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "source-app" });
    await container.db
      .insert(schema.spaces)
      .values({ id: "space-1", name: "Space", creatorId: "user-1" });
    mockDuplicateApp(container);
    const result = await createAppFromExisting({
      container,
      headers: headers(),
      input: {
        sourceAppId: "source-app",
        name: "Copy App",
        spaceId: "space-1",
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should throw BusinessRuleError for empty name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "source-app" });
    await expect(
      createAppFromExisting({
        container,
        headers: headers(),
        input: {
          sourceAppId: "source-app",
          name: "",
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw BusinessRuleError for name with 65+ characters", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "source-app" });
    await expect(
      createAppFromExisting({
        container,
        headers: headers(),
        input: {
          sourceAppId: "source-app",
          name: "a".repeat(65),
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError for non-existent sourceAppId", async () => {
    const container = getContainer();
    await expect(
      createAppFromExisting({
        container,
        headers: headers(),
        input: {
          sourceAppId: "non-existent",
          name: "Copy",
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError for non-existent spaceId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedApp(container.db, { id: "source-app" });
    await expect(
      createAppFromExisting({
        container,
        headers: headers(),
        input: {
          sourceAppId: "source-app",
          name: "Copy",
          spaceId: "bad-space",
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when app count reaches 1000", async () => {
    const container = getContainer();
    await seedUser(container.db);
    const values = Array.from({ length: 1000 }, (_, i) => ({
      id: `app-${i}`,
      name: `A${i}`,
      status: "ACTIVE" as const,
      revision: 1,
      creatorId: "user-1",
      modifierId: "user-1",
    }));
    for (let i = 0; i < values.length; i += 100) {
      await container.db.insert(schema.apps).values(values.slice(i, i + 100));
    }
    await expect(
      createAppFromExisting({
        container,
        headers: headers(),
        input: {
          sourceAppId: "app-0",
          name: "Copy",
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
