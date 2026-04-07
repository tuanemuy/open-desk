import { describe, expect, it, vi } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { App } from "@/core/domain/app/entity";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError, ValidationError } from "../error";
import { createAppFromFile } from "./createAppFromFile";

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

function mockCreation(container: ReturnType<typeof getContainer>) {
  const app = App.create({
    name: "File App",
    creatorId: "user-1" as never,
    spaceId: null,
    threadId: null,
  }).entity;
  vi.spyOn(container.appCreationService, "createFromExcel").mockResolvedValue({
    app,
    fields: [],
    formLayout: null,
    views: [],
    reports: [],
  });
  vi.spyOn(container.appCreationService, "createFromCsv").mockResolvedValue({
    app,
    fields: [],
    formLayout: null,
    views: [],
    reports: [],
  });
}

describe("createAppFromFile", () => {
  it("should create an app from an Excel file", async () => {
    const container = getContainer();
    await seedUser(container.db);
    mockCreation(container);
    const result = await createAppFromFile({
      container,
      headers: headers(),
      input: {
        file: new ArrayBuffer(100),
        fileType: "EXCEL",
        name: "Excel App",
        spaceId: null,
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should create an app from a CSV file", async () => {
    const container = getContainer();
    await seedUser(container.db);
    mockCreation(container);
    const result = await createAppFromFile({
      container,
      headers: headers(),
      input: {
        file: new ArrayBuffer(100),
        fileType: "CSV",
        name: "CSV App",
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
    mockCreation(container);
    const result = await createAppFromFile({
      container,
      headers: headers(),
      input: {
        file: new ArrayBuffer(100),
        fileType: "EXCEL",
        name: "App",
        spaceId: "space-1",
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should throw ValidationError for empty file", async () => {
    const container = getContainer();
    await expect(
      createAppFromFile({
        container,
        headers: headers(),
        input: {
          file: new ArrayBuffer(0),
          fileType: "EXCEL",
          name: "App",
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw for empty name", async () => {
    const container = getContainer();
    await expect(
      createAppFromFile({
        container,
        headers: headers(),
        input: {
          file: new ArrayBuffer(100),
          fileType: "EXCEL",
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
      createAppFromFile({
        container,
        headers: headers(),
        input: {
          file: new ArrayBuffer(100),
          fileType: "EXCEL",
          name: "a".repeat(65),
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw NotFoundError for non-existent spaceId", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await expect(
      createAppFromFile({
        container,
        headers: headers(),
        input: {
          file: new ArrayBuffer(100),
          fileType: "EXCEL",
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
      createAppFromFile({
        container,
        headers: headers(),
        input: {
          file: new ArrayBuffer(100),
          fileType: "EXCEL",
          name: "App",
          spaceId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
