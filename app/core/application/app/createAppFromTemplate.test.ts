import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { App } from "@/core/domain/app/entity";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { createAppFromTemplate } from "./createAppFromTemplate";

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

function mockTemplate(container: ReturnType<typeof getContainer>) {
  const app = App.create({
    name: "Tpl App",
    creatorId: "user-1" as never,
    spaceId: null,
    threadId: null,
  }).entity;
  vi.spyOn(
    container.appCreationService,
    "createFromTemplate",
  ).mockResolvedValue({
    app,
    fields: [],
    formLayout: null,
    views: [],
    reports: [],
  });
}

describe("createAppFromTemplate", () => {
  it("should create an app from a template", async () => {
    const container = getContainer();
    await seedUser(container.db);
    mockTemplate(container);
    const result = await createAppFromTemplate({
      container,
      headers: headers(),
      input: {
        templateId: "tpl-1",
        name: "From Tpl",
        spaceId: null,
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should create an app in a specific space", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await container.db
      .insert(schema.spaces)
      .values({ id: "space-1", name: "Space", creatorId: "user-1" });
    mockTemplate(container);
    const result = await createAppFromTemplate({
      container,
      headers: headers(),
      input: {
        templateId: "tpl-1",
        name: "From Tpl",
        spaceId: "space-1",
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should throw for empty name", async () => {
    const container = getContainer();
    await expect(
      createAppFromTemplate({
        container,
        headers: headers(),
        input: {
          templateId: "tpl-1",
          name: "",
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw for name with 65+ characters", async () => {
    const container = getContainer();
    await expect(
      createAppFromTemplate({
        container,
        headers: headers(),
        input: {
          templateId: "tpl-1",
          name: "a".repeat(65),
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow();
  });

  it("should accept name with exactly 1 character (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    mockTemplate(container);
    const result = await createAppFromTemplate({
      container,
      headers: headers(),
      input: {
        templateId: "tpl-1",
        name: "a",
        spaceId: null,
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should accept name with exactly 64 characters (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    mockTemplate(container);
    const result = await createAppFromTemplate({
      container,
      headers: headers(),
      input: {
        templateId: "tpl-1",
        name: "a".repeat(64),
        spaceId: null,
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should throw NotFoundError for non-existent spaceId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await expect(
      createAppFromTemplate({
        container,
        headers: headers(),
        input: {
          templateId: "tpl-1",
          name: "App",
          spaceId: "bad",
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
      createAppFromTemplate({
        container,
        headers: headers(),
        input: {
          templateId: "tpl-1",
          name: "App",
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
