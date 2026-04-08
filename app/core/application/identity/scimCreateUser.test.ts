import { describe, expect, it } from "vitest";
import { ScryptBearerTokenHasher } from "@/core/adapters/drizzleSqlite/repositories/bearerTokenHasher";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  ConflictError,
  ForbiddenError,
  UnauthenticatedError,
  ValidationError,
} from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { scimCreateUser } from "./scimCreateUser";

describe("scimCreateUser", () => {
  const getContainer = setupTestContainer();
  const tokenHasher = new ScryptBearerTokenHasher();
  const passwordHasher = new ScryptPasswordHasher();

  async function enableProvisioningWithToken(
    container: ReturnType<typeof getContainer>,
  ) {
    const token = tokenHasher.generate();
    const hashed = tokenHasher.hash(token);
    const now = new Date();
    await container.db.insert(schema.provisioningConfigs).values({
      id: crypto.randomUUID(),
      isEnabled: true,
      bearerTokenHash: hashed.value,
      bearerTokenAlgorithm: hashed.algorithm,
      tokenIssuedAt: now,
    });
    return token as string;
  }

  async function insertUser(
    container: ReturnType<typeof getContainer>,
    loginName: string,
    email: string,
  ) {
    const userId = crypto.randomUUID();
    const hashed = await passwordHasher.hash("password123");
    await container.db.insert(schema.users).values({
      id: userId,
      loginName,
      displayName: "Existing User",
      email,
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });
    return userId;
  }

  it("should create SCIM user with all required fields", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    const result = await scimCreateUser({
      container,
      headers: createMockHeaders(),
      input: {
        bearerToken: token,
        externalId: "ext-001",
        userName: "scimuser@example.com",
        displayName: "SCIM User",
        email: "scimuser@example.com",
      },
    });

    expect(result.id).toBeDefined();
    expect(result.externalId).toBe("ext-001");
    expect(result.userName).toBe("scimuser@example.com");
    expect(result.displayName).toBe("SCIM User");
    expect(result.email).toBe("scimuser@example.com");
    expect(result.active).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should create SCIM user with active=false", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    const result = await scimCreateUser({
      container,
      headers: createMockHeaders(),
      input: {
        bearerToken: token,
        externalId: "ext-002",
        userName: "inactive@example.com",
        displayName: "Inactive User",
        email: "inactive@example.com",
        active: false,
      },
    });

    expect(result.active).toBe(false);
  });

  it("should create SCIM user with active=true (default) when active is omitted", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    const result = await scimCreateUser({
      container,
      headers: createMockHeaders(),
      input: {
        bearerToken: token,
        externalId: "ext-003",
        userName: "default-active@example.com",
        displayName: "Default Active User",
        email: "default-active@example.com",
      },
    });

    expect(result.active).toBe(true);
  });

  it("should throw ValidationError when bearerToken is empty", async () => {
    const container = getContainer();

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: "",
          externalId: "ext-004",
          userName: "user@example.com",
          displayName: "User",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when externalId is empty", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token,
          externalId: "",
          userName: "user@example.com",
          displayName: "User",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when userName is empty", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token,
          externalId: "ext-005",
          userName: "",
          displayName: "User",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw error when userName is not email format", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token,
          externalId: "ext-006",
          userName: "not-an-email",
          displayName: "User",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw error when displayName is empty", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token,
          externalId: "ext-007",
          userName: "user@example.com",
          displayName: "",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when email is empty", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token,
          externalId: "ext-008",
          userName: "user@example.com",
          displayName: "User",
          email: "",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw error when email is not email format", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token,
          externalId: "ext-009",
          userName: "user@example.com",
          displayName: "User",
          email: "not-an-email",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw ForbiddenError when provisioning is disabled", async () => {
    const container = getContainer();

    // Insert disabled provisioning config with a token
    const token = tokenHasher.generate();
    const hashed = tokenHasher.hash(token);
    await container.db.insert(schema.provisioningConfigs).values({
      id: crypto.randomUUID(),
      isEnabled: false,
      bearerTokenHash: hashed.value,
      bearerTokenAlgorithm: hashed.algorithm,
      tokenIssuedAt: new Date(),
    });

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token as string,
          externalId: "ext-010",
          userName: "user@example.com",
          displayName: "User",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw UnauthenticatedError when bearer token is invalid", async () => {
    const container = getContainer();
    await enableProvisioningWithToken(container);

    // Generate a different token that does not match the stored one
    const wrongToken = tokenHasher.generate();

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: wrongToken as string,
          externalId: "ext-011",
          userName: "user@example.com",
          displayName: "User",
          email: "user@example.com",
        },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it("should throw ConflictError when externalId mapping already exists", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    // Create first user
    await scimCreateUser({
      container,
      headers: createMockHeaders(),
      input: {
        bearerToken: token,
        externalId: "ext-duplicate",
        userName: "first@example.com",
        displayName: "First User",
        email: "first@example.com",
      },
    });

    // Attempt to create another user with the same externalId
    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token,
          externalId: "ext-duplicate",
          userName: "second@example.com",
          displayName: "Second User",
          email: "second@example.com",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when userName already exists", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    await insertUser(container, "existing@example.com", "other@example.com");

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token,
          externalId: "ext-012",
          userName: "existing@example.com",
          displayName: "Duplicate LoginName",
          email: "different@example.com",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when email already exists", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    await insertUser(container, "other@example.com", "existing@example.com");

    await expect(
      scimCreateUser({
        container,
        headers: createMockHeaders(),
        input: {
          bearerToken: token,
          externalId: "ext-013",
          userName: "newuser@example.com",
          displayName: "Duplicate Email",
          email: "existing@example.com",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should create SCIM external mapping with correct resourceType", async () => {
    const container = getContainer();
    const token = await enableProvisioningWithToken(container);

    const result = await scimCreateUser({
      container,
      headers: createMockHeaders(),
      input: {
        bearerToken: token,
        externalId: "ext-mapping-check",
        userName: "mappingcheck@example.com",
        displayName: "Mapping Check User",
        email: "mappingcheck@example.com",
      },
    });

    // Verify the mapping was created in the database
    const mappings = await container.db
      .select()
      .from(schema.scimExternalMappings)
      .all();

    const mapping = mappings.find(
      (m) => m.externalId === "ext-mapping-check" && m.resourceType === "User",
    );
    expect(mapping).toBeDefined();
    expect(mapping?.internalId).toBe(result.id);
  });
});
