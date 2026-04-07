import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  UnauthenticatedError,
  ValidationError,
} from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { login } from "./login";

describe("login", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function createActiveUser(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<{
      id: string;
      loginName: string;
      displayName: string;
      email: string;
      password: string;
      isActive: boolean;
      timezone: string;
      language: string;
      lockedUntil: Date | null;
    }> = {},
  ) {
    const password = overrides.password ?? "password123";
    const hashed = await hasher.hash(password);
    const id = overrides.id ?? crypto.randomUUID();
    await container.db.insert(schema.users).values({
      id,
      loginName: overrides.loginName ?? "test@example.com",
      displayName: overrides.displayName ?? "Test User",
      email: overrides.email ?? "test@example.com",
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: overrides.isActive ?? true,
      timezone: overrides.timezone ?? "Asia/Tokyo",
      language: overrides.language ?? "ja",
    });
    return { id, password, passwordHash: hashed };
  }

  it("should create session with valid credentials", async () => {
    const container = getContainer();
    await createActiveUser(container);

    const result = await login({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "test@example.com",
        password: "password123",
        ipAddress: "192.168.1.1",
        userAgent: "TestBrowser/1.0",
      },
    });

    expect(result.sessionId).toBeDefined();
    expect(result.userId).toBeDefined();
    expect(result.displayName).toBe("Test User");
    expect(result.language).toBe("ja");
    expect(result.timezone).toBe("Asia/Tokyo");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it("should create session with country specified", async () => {
    const container = getContainer();
    await createActiveUser(container);

    const result = await login({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "test@example.com",
        password: "password123",
        ipAddress: "192.168.1.1",
        userAgent: "TestBrowser/1.0",
        country: "JP",
      },
    });

    expect(result.sessionId).toBeDefined();
  });

  it("should create session without country (null)", async () => {
    const container = getContainer();
    await createActiveUser(container);

    const result = await login({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "test@example.com",
        password: "password123",
        ipAddress: "192.168.1.1",
        userAgent: "TestBrowser/1.0",
      },
    });

    expect(result.sessionId).toBeDefined();
  });

  it("should throw ValidationError when loginName is empty", async () => {
    const container = getContainer();

    await expect(
      login({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "",
          password: "password123",
          ipAddress: "192.168.1.1",
          userAgent: "TestBrowser/1.0",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when loginName is not email format", async () => {
    const container = getContainer();

    await expect(
      login({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "not-an-email",
          password: "password123",
          ipAddress: "192.168.1.1",
          userAgent: "TestBrowser/1.0",
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw ValidationError when password is empty", async () => {
    const container = getContainer();

    await expect(
      login({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "test@example.com",
          password: "",
          ipAddress: "192.168.1.1",
          userAgent: "TestBrowser/1.0",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when ipAddress is empty", async () => {
    const container = getContainer();

    await expect(
      login({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "test@example.com",
          password: "password123",
          ipAddress: "",
          userAgent: "TestBrowser/1.0",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when userAgent is empty", async () => {
    const container = getContainer();

    await expect(
      login({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "test@example.com",
          password: "password123",
          ipAddress: "192.168.1.1",
          userAgent: "",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw UnauthenticatedError when user does not exist", async () => {
    const container = getContainer();

    await expect(
      login({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "nonexistent@example.com",
          password: "password123",
          ipAddress: "192.168.1.1",
          userAgent: "TestBrowser/1.0",
        },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it("should throw UnauthenticatedError when password is wrong", async () => {
    const container = getContainer();
    await createActiveUser(container);

    await expect(
      login({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "test@example.com",
          password: "wrongpassword",
          ipAddress: "192.168.1.1",
          userAgent: "TestBrowser/1.0",
        },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it("should throw UnauthenticatedError when user is inactive", async () => {
    const container = getContainer();
    await createActiveUser(container, { isActive: false });

    await expect(
      login({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "test@example.com",
          password: "password123",
          ipAddress: "192.168.1.1",
          userAgent: "TestBrowser/1.0",
        },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it("should create session with IPv4 address", async () => {
    const container = getContainer();
    await createActiveUser(container);

    const result = await login({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "test@example.com",
        password: "password123",
        ipAddress: "192.168.1.1",
        userAgent: "TestBrowser/1.0",
      },
    });

    expect(result.sessionId).toBeDefined();
  });

  it("should create session with IPv6 address", async () => {
    const container = getContainer();
    await createActiveUser(container);

    const result = await login({
      container,
      headers: createMockHeaders(),
      input: {
        loginName: "test@example.com",
        password: "password123",
        ipAddress: "::1",
        userAgent: "TestBrowser/1.0",
      },
    });

    expect(result.sessionId).toBeDefined();
  });
});
