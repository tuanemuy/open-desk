import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ForbiddenError, NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createThreadAction } from "./createThreadAction";

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

async function seedSystemPermission(
  db: ReturnType<typeof getContainer>["db"],
  entityCode: string,
  opts: { systemAdmin?: boolean } = {},
) {
  await db.insert(schema.systemPermissions).values({
    entityType: "USER",
    entityCode,
    systemAdmin: opts.systemAdmin ?? true,
  });
}

async function seedApp(
  db: ReturnType<typeof getContainer>["db"],
  id = "app-1",
  creatorId = "user-1",
) {
  await db.insert(schema.apps).values({
    id,
    name: `App ${id}`,
    status: "ACTIVE",
    revision: 1,
    creatorId,
    modifierId: creatorId,
  });
}

describe("createThreadAction", () => {
  it("should create a thread action with valid input", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedApp(container.db);

    const result = await createThreadAction({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        actionName: "Copy to App",
        destinationAppId: "app-1",
        fieldMappings: [
          {
            sourceField: "COMMENT_TEXT",
            destinationFieldCode:
              "field_1" as import("@/core/domain/space/valueObject").FieldCode,
          },
        ],
      },
    });

    expect(result.threadActionId).toBeDefined();
    expect(result.actionName).toBe("Copy to App");
    expect(result.destinationAppId).toBe("app-1");
    expect(result.fieldMappings).toHaveLength(1);
    expect(result.modifierId).toBe("user-1");
    expect(result.modifiedAt).toBeInstanceOf(Date);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should create a thread action with 100 field mappings (upper boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedApp(container.db);

    const sourceFields = [
      "COMMENT_TEXT",
      "COMMENTER",
      "COMMENT_DATETIME",
      "THREAD_TITLE",
      "SPACE_NAME",
    ] as const;
    const mappings = Array.from({ length: 100 }, (_, i) => ({
      sourceField: sourceFields[i % sourceFields.length],
      destinationFieldCode:
        `field_${i}` as import("@/core/domain/space/valueObject").FieldCode,
    }));

    const result = await createThreadAction({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        actionName: "Bulk Copy",
        destinationAppId: "app-1",
        fieldMappings: mappings,
      },
    });

    expect(result.fieldMappings).toHaveLength(100);
  });

  it("should create a thread action with 1-character name (lower boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedApp(container.db);

    const result = await createThreadAction({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        actionName: "A",
        destinationAppId: "app-1",
        fieldMappings: [
          {
            sourceField: "COMMENT_TEXT",
            destinationFieldCode:
              "field_1" as import("@/core/domain/space/valueObject").FieldCode,
          },
        ],
      },
    });

    expect(result.actionName).toBe("A");
  });

  it("should create a thread action with 128-character name (upper boundary)", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedApp(container.db);

    const name = "a".repeat(128);
    const result = await createThreadAction({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        actionName: name,
        destinationAppId: "app-1",
        fieldMappings: [
          {
            sourceField: "COMMENT_TEXT",
            destinationFieldCode:
              "field_1" as import("@/core/domain/space/valueObject").FieldCode,
          },
        ],
      },
    });

    expect(result.actionName).toBe(name);
  });

  it("should throw ForbiddenError when operator lacks system admin permission", async () => {
    const container = getContainer();
    await seedUser(container.db);
    // No system permission seeded

    await expect(
      createThreadAction({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          actionName: "Test",
          destinationAppId: "app-1",
          fieldMappings: [
            {
              sourceField: "COMMENT_TEXT",
              destinationFieldCode:
                "field_1" as import("@/core/domain/space/valueObject").FieldCode,
            },
          ],
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw BusinessRuleError for empty action name", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedApp(container.db);

    await expect(
      createThreadAction({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          actionName: "",
          destinationAppId: "app-1",
          fieldMappings: [
            {
              sourceField: "COMMENT_TEXT",
              destinationFieldCode:
                "field_1" as import("@/core/domain/space/valueObject").FieldCode,
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for action name exceeding 128 characters", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedApp(container.db);

    await expect(
      createThreadAction({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          actionName: "a".repeat(129),
          destinationAppId: "app-1",
          fieldMappings: [
            {
              sourceField: "COMMENT_TEXT",
              destinationFieldCode:
                "field_1" as import("@/core/domain/space/valueObject").FieldCode,
            },
          ],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError for non-existent destination app", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");

    await expect(
      createThreadAction({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          actionName: "Test",
          destinationAppId: "non-existent-app",
          fieldMappings: [
            {
              sourceField: "COMMENT_TEXT",
              destinationFieldCode:
                "field_1" as import("@/core/domain/space/valueObject").FieldCode,
            },
          ],
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw BusinessRuleError for empty field mappings", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedApp(container.db);

    await expect(
      createThreadAction({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          actionName: "Test",
          destinationAppId: "app-1",
          fieldMappings: [],
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for more than 100 field mappings", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedApp(container.db);

    const sourceFields = [
      "COMMENT_TEXT",
      "COMMENTER",
      "COMMENT_DATETIME",
      "THREAD_TITLE",
      "SPACE_NAME",
    ] as const;
    const mappings = Array.from({ length: 101 }, (_, i) => ({
      sourceField: sourceFields[i % sourceFields.length],
      destinationFieldCode: `field_${i}`,
    })) as unknown as readonly import("@/core/domain/space/valueObject").ThreadActionFieldMapping[];

    await expect(
      createThreadAction({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
          actionName: "Test",
          destinationAppId: "app-1",
          fieldMappings: mappings,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
