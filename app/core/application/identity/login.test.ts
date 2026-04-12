import { eq } from "drizzle-orm";
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
      failedLoginAttempts: number;
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
      failedLoginAttempts: overrides.failedLoginAttempts ?? 0,
      lockedUntil: overrides.lockedUntil ?? null,
    });
    return { id, password, passwordHash: hashed };
  }

  async function seedLockoutPolicy(
    container: ReturnType<typeof getContainer>,
    policy: {
      maxFailedAttempts: number | null;
      lockoutDurationMinutes: number | null;
    },
  ) {
    await container.db.insert(schema.systemSettings).values({
      key: "lockout_policy",
      value: {
        maxFailedAttempts: policy.maxFailedAttempts,
        lockoutDurationMinutes: policy.lockoutDurationMinutes,
        failedLoginMessage: {},
      },
    });
  }

  async function getUserRow(
    container: ReturnType<typeof getContainer>,
    userId: string,
  ) {
    const rows = await container.db
      .select({
        failedLoginAttempts: schema.users.failedLoginAttempts,
        lockedUntil: schema.users.lockedUntil,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    return rows[0];
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

  describe("lockout", () => {
    it("should increment failedLoginAttempts on login failure", async () => {
      const container = getContainer();
      const { id } = await createActiveUser(container);
      await seedLockoutPolicy(container, {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 30,
      });

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

      const row = await getUserRow(container, id);
      expect(row.failedLoginAttempts).toBe(1);
      expect(row.lockedUntil).toBeNull();
    });

    it("should set lockedUntil when threshold is reached", async () => {
      const container = getContainer();
      const { id } = await createActiveUser(container, {
        failedLoginAttempts: 4,
      });
      await seedLockoutPolicy(container, {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 30,
      });

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

      const row = await getUserRow(container, id);
      expect(row.failedLoginAttempts).toBe(5);
      expect(row.lockedUntil).not.toBeNull();
      // lockedUntil should be approximately 30 minutes from now
      const expectedLock = Date.now() + 30 * 60 * 1000;
      expect(row.lockedUntil?.getTime()).toBeGreaterThan(expectedLock - 10_000);
      expect(row.lockedUntil?.getTime()).toBeLessThan(expectedLock + 10_000);
    });

    it("should throw UnauthenticatedError when account is locked", async () => {
      const container = getContainer();
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      await createActiveUser(container, {
        failedLoginAttempts: 5,
        lockedUntil,
      });
      await seedLockoutPolicy(container, {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 30,
      });

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

    it("should allow login after lock expires with correct password", async () => {
      const container = getContainer();
      // lockedUntil is in the past (lock expired)
      const lockedUntil = new Date(Date.now() - 1000);
      await createActiveUser(container, {
        failedLoginAttempts: 5,
        lockedUntil,
      });
      await seedLockoutPolicy(container, {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 30,
      });

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

    it("should reset failedLoginAttempts on successful login", async () => {
      const container = getContainer();
      const { id } = await createActiveUser(container, {
        failedLoginAttempts: 3,
      });
      await seedLockoutPolicy(container, {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 30,
      });

      await login({
        container,
        headers: createMockHeaders(),
        input: {
          loginName: "test@example.com",
          password: "password123",
          ipAddress: "192.168.1.1",
          userAgent: "TestBrowser/1.0",
        },
      });

      const row = await getUserRow(container, id);
      expect(row.failedLoginAttempts).toBe(0);
      expect(row.lockedUntil).toBeNull();
    });

    it("should re-lock account when login fails after lock expiry", async () => {
      const container = getContainer();
      const lockedUntil = new Date(Date.now() - 1000); // expired
      const { id } = await createActiveUser(container, {
        failedLoginAttempts: 5,
        lockedUntil,
      });
      await seedLockoutPolicy(container, {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 30,
      });

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

      const row = await getUserRow(container, id);
      expect(row.failedLoginAttempts).toBe(6);
      expect(row.lockedUntil).not.toBeNull();
    });

    it("should set permanent lock when lockoutDurationMinutes is null", async () => {
      const container = getContainer();
      const { id } = await createActiveUser(container, {
        failedLoginAttempts: 4,
      });
      await seedLockoutPolicy(container, {
        maxFailedAttempts: 5,
        lockoutDurationMinutes: null,
      });

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

      const row = await getUserRow(container, id);
      expect(row.failedLoginAttempts).toBe(5);
      expect(row.lockedUntil).not.toBeNull();
      // Should be set to far future (9999-12-31)
      expect(row.lockedUntil?.getFullYear()).toBe(9999);
    });

    it("should not lock account when lockout_policy is not configured", async () => {
      const container = getContainer();
      const { id } = await createActiveUser(container);
      // No lockout_policy seed — uses default (lockout disabled)

      // Fail login multiple times
      for (let i = 0; i < 10; i++) {
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
      }

      const row = await getUserRow(container, id);
      // failedLoginAttempts should remain 0 because lockout is disabled
      expect(row.failedLoginAttempts).toBe(0);
      expect(row.lockedUntil).toBeNull();

      // Should still be able to login with correct password
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
  });
});
