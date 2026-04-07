import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { BusinessRuleError } from "@/core/domain/error";
import { NotFoundError } from "../error";
import { createAppBlank } from "./createAppBlank";

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

describe("createAppBlank", () => {
  it("should create a PREVIEW app with name only", async () => {
    const container = getContainer();
    await seedUser(container.db);
    const result = await createAppBlank({
      container,
      headers: headers(),
      input: {
        name: "Test App",
        spaceId: null,
        threadId: null,
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
    expect(result.name).toBe("Test App");
    expect(result.appId).toBeDefined();
    expect(result.revision).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should create an app in a specific space", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await container.db.insert(schema.spaces).values({
      id: "space-1",
      name: "Space 1",
      creatorId: "user-1",
    });
    const result = await createAppBlank({
      container,
      headers: headers(),
      input: {
        name: "Space App",
        spaceId: "space-1",
        threadId: null,
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should create an app in a specific space and thread", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await container.db.insert(schema.spaces).values({
      id: "space-2",
      name: "Space 2",
      creatorId: "user-1",
    });
    await container.db.insert(schema.threads).values({
      id: "thread-1",
      spaceId: "space-2",
      title: "Thread 1",
      creatorId: "user-1",
    });
    const result = await createAppBlank({
      container,
      headers: headers(),
      input: {
        name: "Thread App",
        spaceId: "space-2",
        threadId: "thread-1",
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });

  it("should throw BusinessRuleError for empty name", async () => {
    const container = getContainer();
    await expect(
      createAppBlank({
        container,
        headers: headers(),
        input: { name: "", spaceId: null, threadId: null, creatorId: "user-1" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for name with 65+ characters", async () => {
    const container = getContainer();
    await expect(
      createAppBlank({
        container,
        headers: headers(),
        input: {
          name: "a".repeat(65),
          spaceId: null,
          threadId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should accept name with exactly 1 character (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    const result = await createAppBlank({
      container,
      headers: headers(),
      input: { name: "a", spaceId: null, threadId: null, creatorId: "user-1" },
    });
    expect(result.name).toBe("a");
  });

  it("should accept name with exactly 64 characters (boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    const name = "a".repeat(64);
    const result = await createAppBlank({
      container,
      headers: headers(),
      input: { name, spaceId: null, threadId: null, creatorId: "user-1" },
    });
    expect(result.name).toBe(name);
  });

  it("should throw NotFoundError for non-existent spaceId", async () => {
    const container = getContainer();
    await expect(
      createAppBlank({
        container,
        headers: headers(),
        input: {
          name: "App",
          spaceId: "non-existent-space",
          threadId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError when threadId is specified without spaceId", async () => {
    const container = getContainer();
    await expect(
      createAppBlank({
        container,
        headers: headers(),
        input: {
          name: "App",
          spaceId: null,
          threadId: "thread-1",
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when app count reaches 1000", async () => {
    const container = getContainer();
    await seedUser(container.db);
    const values = Array.from({ length: 1000 }, (_, i) => ({
      id: `app-limit-${i}`,
      name: `App ${i}`,
      status: "ACTIVE" as const,
      revision: 1,
      creatorId: "user-1",
      modifierId: "user-1",
    }));
    for (let i = 0; i < values.length; i += 100) {
      await container.db.insert(schema.apps).values(values.slice(i, i + 100));
    }
    await expect(
      createAppBlank({
        container,
        headers: headers(),
        input: {
          name: "Over Limit",
          spaceId: null,
          threadId: null,
          creatorId: "user-1",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should succeed when app count is 999 (boundary: just before limit)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    const values = Array.from({ length: 999 }, (_, i) => ({
      id: `app-boundary-${i}`,
      name: `App ${i}`,
      status: "ACTIVE" as const,
      revision: 1,
      creatorId: "user-1",
      modifierId: "user-1",
    }));
    for (let i = 0; i < values.length; i += 100) {
      await container.db.insert(schema.apps).values(values.slice(i, i + 100));
    }
    const result = await createAppBlank({
      container,
      headers: headers(),
      input: {
        name: "Boundary App",
        spaceId: null,
        threadId: null,
        creatorId: "user-1",
      },
    });
    expect(result.status).toBe("PREVIEW");
  });
});
