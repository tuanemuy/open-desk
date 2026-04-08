import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { getLoginSecurity } from "./getLoginSecurity";

describe("getLoginSecurity", () => {
  const getContainer = setupTestContainer();

  const passwordPolicyValue = {
    userMinLength: 8,
    adminMinLength: 10,
    complexity: "ALPHANUMERIC",
    allowSameAsLoginName: false,
    expirationDays: 90,
    historyCount: 3,
    allowUserChange: true,
    requireChangeOnNextLogin: false,
    allowUserReset: true,
  };

  const lockoutPolicyValue = {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30,
    failedLoginMessage: { ja: "ログインに失敗しました" },
  };

  const sessionPolicyValue = {
    sessionLifetimeMinutes: 480,
    allowAutoComplete: true,
    allowBrowserSave: true,
    allowAutoLogin: false,
    autoLoginExpiration: null,
    allowMismatchedApiAuth: false,
  };

  const samlAuthValue = {
    enabled: false,
  };

  const twoFactorAuthValue = {
    enabled: true,
  };

  async function insertAllLoginSecuritySettings(
    container: ReturnType<typeof getContainer>,
  ) {
    await container.db.insert(schema.systemSettings).values([
      {
        id: crypto.randomUUID(),
        key: "password_policy",
        value: passwordPolicyValue,
      },
      {
        id: crypto.randomUUID(),
        key: "lockout_policy",
        value: lockoutPolicyValue,
      },
      {
        id: crypto.randomUUID(),
        key: "session_policy",
        value: sessionPolicyValue,
      },
      { id: crypto.randomUUID(), key: "saml_auth", value: samlAuthValue },
      {
        id: crypto.randomUUID(),
        key: "two_factor_auth",
        value: twoFactorAuthValue,
      },
    ]);
  }

  async function insertSettingsExcept(
    container: ReturnType<typeof getContainer>,
    excludeKey: string,
  ) {
    const settings = [
      {
        id: crypto.randomUUID(),
        key: "password_policy",
        value: passwordPolicyValue,
      },
      {
        id: crypto.randomUUID(),
        key: "lockout_policy",
        value: lockoutPolicyValue,
      },
      {
        id: crypto.randomUUID(),
        key: "session_policy",
        value: sessionPolicyValue,
      },
      { id: crypto.randomUUID(), key: "saml_auth", value: samlAuthValue },
      {
        id: crypto.randomUUID(),
        key: "two_factor_auth",
        value: twoFactorAuthValue,
      },
    ].filter((s) => s.key !== excludeKey);

    if (settings.length > 0) {
      await container.db.insert(schema.systemSettings).values(settings);
    }
  }

  it("should return all login security settings when all exist", async () => {
    const container = getContainer();
    await insertAllLoginSecuritySettings(container);

    const result = await getLoginSecurity({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.passwordPolicy).toEqual(passwordPolicyValue);
    expect(result.lockoutPolicy).toEqual(lockoutPolicyValue);
    expect(result.sessionPolicy).toEqual(sessionPolicyValue);
    expect(result.samlAuth).toEqual(samlAuthValue);
    expect(result.twoFactorAuth).toEqual(twoFactorAuthValue);
  });

  it("should throw NotFoundError when password_policy is missing", async () => {
    const container = getContainer();
    await insertSettingsExcept(container, "password_policy");

    await expect(
      getLoginSecurity({
        container,
        headers: createMockHeaders(),
        input: undefined,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when lockout_policy is missing", async () => {
    const container = getContainer();
    await insertSettingsExcept(container, "lockout_policy");

    await expect(
      getLoginSecurity({
        container,
        headers: createMockHeaders(),
        input: undefined,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when session_policy is missing", async () => {
    const container = getContainer();
    await insertSettingsExcept(container, "session_policy");

    await expect(
      getLoginSecurity({
        container,
        headers: createMockHeaders(),
        input: undefined,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when saml_auth is missing", async () => {
    const container = getContainer();
    await insertSettingsExcept(container, "saml_auth");

    await expect(
      getLoginSecurity({
        container,
        headers: createMockHeaders(),
        input: undefined,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when two_factor_auth is missing", async () => {
    const container = getContainer();
    await insertSettingsExcept(container, "two_factor_auth");

    await expect(
      getLoginSecurity({
        container,
        headers: createMockHeaders(),
        input: undefined,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when no settings exist at all", async () => {
    const container = getContainer();

    await expect(
      getLoginSecurity({
        container,
        headers: createMockHeaders(),
        input: undefined,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
