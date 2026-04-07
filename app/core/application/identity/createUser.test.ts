import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ConflictError, ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { createUser } from "./createUser";

describe("createUser", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  it("should create user with all required fields", async () => {
    const container = getContainer();

    const result = await createUser({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "newuser@example.com",
        displayName: "New User",
        email: "newuser@example.com",
        password: "securepass123",
      },
    });

    expect(result.userId).toBeDefined();
    expect(result.loginName).toBe("newuser@example.com");
    expect(result.displayName).toBe("New User");
    expect(result.email).toBe("newuser@example.com");
    expect(result.timezone).toBe("Asia/Tokyo");
    expect(result.language).toBe("ja");
    expect(result.isActive).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should create user with default timezone and language when omitted", async () => {
    const container = getContainer();

    const result = await createUser({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "newuser@example.com",
        displayName: "New User",
        email: "newuser@example.com",
        password: "securepass123",
      },
    });

    expect(result.timezone).toBe("Asia/Tokyo");
    expect(result.language).toBe("ja");
  });

  it("should create user with specified timezone and language", async () => {
    const container = getContainer();

    const result = await createUser({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "newuser@example.com",
        displayName: "New User",
        email: "newuser@example.com",
        password: "securepass123",
        timezone: "America/New_York",
        language: "en",
      },
    });

    expect(result.timezone).toBe("America/New_York");
    expect(result.language).toBe("en");
  });

  it("should throw error when loginName is empty", async () => {
    const container = getContainer();

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "",
          displayName: "New User",
          email: "newuser@example.com",
          password: "securepass123",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw error when loginName is not email format", async () => {
    const container = getContainer();

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "not-an-email",
          displayName: "New User",
          email: "newuser@example.com",
          password: "securepass123",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw ValidationError when displayName is empty", async () => {
    const container = getContainer();

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "newuser@example.com",
          displayName: "",
          email: "newuser@example.com",
          password: "securepass123",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when email is empty", async () => {
    const container = getContainer();

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "newuser@example.com",
          displayName: "New User",
          email: "",
          password: "securepass123",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw error when email is not email format", async () => {
    const container = getContainer();

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "newuser@example.com",
          displayName: "New User",
          email: "not-an-email",
          password: "securepass123",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw error when password does not meet policy (too short)", async () => {
    const container = getContainer();

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "newuser@example.com",
          displayName: "New User",
          email: "newuser@example.com",
          password: "short",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw error when timezone is invalid", async () => {
    const container = getContainer();

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "newuser@example.com",
          displayName: "New User",
          email: "newuser@example.com",
          password: "securepass123",
          timezone: "Invalid/Timezone",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw error when language is unsupported", async () => {
    const container = getContainer();

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "newuser@example.com",
          displayName: "New User",
          email: "newuser@example.com",
          password: "securepass123",
          language: "fr",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw ConflictError when loginName already exists", async () => {
    const container = getContainer();
    const hashed = await hasher.hash("password123");

    await container.db.insert(schema.users).values({
      id: crypto.randomUUID(),
      loginName: "existing@example.com",
      displayName: "Existing User",
      email: "existing@example.com",
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "existing@example.com",
          displayName: "New User",
          email: "different@example.com",
          password: "securepass123",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when email already exists", async () => {
    const container = getContainer();
    const hashed = await hasher.hash("password123");

    await container.db.insert(schema.users).values({
      id: crypto.randomUUID(),
      loginName: "existing@example.com",
      displayName: "Existing User",
      email: "existing@example.com",
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });

    await expect(
      createUser({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "different@example.com",
          displayName: "New User",
          email: "existing@example.com",
          password: "securepass123",
        },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should create user with zh-CN language", async () => {
    const container = getContainer();

    const result = await createUser({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "zhcn@example.com",
        displayName: "Chinese User",
        email: "zhcn@example.com",
        password: "securepass123",
        language: "zh-CN",
      },
    });

    expect(result.language).toBe("zh-CN");
  });

  it("should create user with zh-TW language", async () => {
    const container = getContainer();

    const result = await createUser({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "zhtw@example.com",
        displayName: "Taiwanese User",
        email: "zhtw@example.com",
        password: "securepass123",
        language: "zh-TW",
      },
    });

    expect(result.language).toBe("zh-TW");
  });

  it("should create user with es language", async () => {
    const container = getContainer();

    const result = await createUser({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "es@example.com",
        displayName: "Spanish User",
        email: "es@example.com",
        password: "securepass123",
        language: "es",
      },
    });

    expect(result.language).toBe("es");
  });

  it("should create user with pt-BR language", async () => {
    const container = getContainer();

    const result = await createUser({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "ptbr@example.com",
        displayName: "Brazilian User",
        email: "ptbr@example.com",
        password: "securepass123",
        language: "pt-BR",
      },
    });

    expect(result.language).toBe("pt-BR");
  });

  it("should create user with th language", async () => {
    const container = getContainer();

    const result = await createUser({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "th@example.com",
        displayName: "Thai User",
        email: "th@example.com",
        password: "securepass123",
        language: "th",
      },
    });

    expect(result.language).toBe("th");
  });
});
