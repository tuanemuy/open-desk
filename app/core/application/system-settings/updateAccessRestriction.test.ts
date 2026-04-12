import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updateAccessRestriction } from "./updateAccessRestriction";

describe("updateAccessRestriction", () => {
  const getContainer = setupTestContainer();

  type AccessRestrictionValue = {
    ipRestrictionEnabled: boolean;
    allowedIps: { cidr: string; description: string }[];
    basicAuthEnabled: boolean;
    basicAuthUsername: string | null;
    basicAuthPasswordHash: string | null;
  };

  const defaultExistingValue: AccessRestrictionValue = {
    ipRestrictionEnabled: false,
    allowedIps: [],
    basicAuthEnabled: false,
    basicAuthUsername: null,
    basicAuthPasswordHash: null,
  };

  async function insertAccessRestrictionSetting(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<AccessRestrictionValue> = {},
  ) {
    const settingId = crypto.randomUUID();
    await container.db.insert(schema.systemSettings).values({
      id: settingId,
      key: "access_restriction",
      value: { ...defaultExistingValue, ...overrides },
    });
    return settingId;
  }

  it("should update with IP restriction enabled and valid CIDR and basic auth", async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    const result = await updateAccessRestriction({
      container,
      headers: createMockHeaders(),
      input: {
        ipRestrictionEnabled: true,
        allowedIps: [{ cidr: "192.168.1.0/24", description: "Office network" }],
        basicAuthEnabled: true,
        basicAuthUsername: "admin",
        basicAuthPassword: "password123",
      },
    });

    expect(result.ipRestrictionEnabled).toBe(true);
    expect(result.allowedIps).toHaveLength(1);
    expect(result.allowedIps[0].cidr).toBe("192.168.1.0/24");
    expect(result.basicAuthEnabled).toBe(true);
    expect(result.basicAuthUsername).toBe("admin");
    // Password hash should not be included in output
    expect(result).not.toHaveProperty("basicAuthPasswordHash");
  });

  it("should update with IP restriction disabled and empty allowedIps", async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    const result = await updateAccessRestriction({
      container,
      headers: createMockHeaders(),
      input: {
        ipRestrictionEnabled: false,
        allowedIps: [],
        basicAuthEnabled: false,
        basicAuthUsername: null,
        basicAuthPassword: null,
      },
    });

    expect(result.ipRestrictionEnabled).toBe(false);
    expect(result.allowedIps).toHaveLength(0);
  });

  it('should accept valid CIDR "192.168.1.0/24"', async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    const result = await updateAccessRestriction({
      container,
      headers: createMockHeaders(),
      input: {
        ipRestrictionEnabled: true,
        allowedIps: [{ cidr: "192.168.1.0/24", description: "Office network" }],
        basicAuthEnabled: false,
        basicAuthUsername: null,
        basicAuthPassword: null,
      },
    });

    expect(result.allowedIps[0].cidr).toBe("192.168.1.0/24");
  });

  it('should accept valid CIDR "10.0.0.0/8"', async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    const result = await updateAccessRestriction({
      container,
      headers: createMockHeaders(),
      input: {
        ipRestrictionEnabled: true,
        allowedIps: [{ cidr: "10.0.0.0/8", description: "Private network" }],
        basicAuthEnabled: false,
        basicAuthUsername: null,
        basicAuthPassword: null,
      },
    });

    expect(result.allowedIps[0].cidr).toBe("10.0.0.0/8");
  });

  it('should accept format-valid CIDR "999.999.999.999/32" (regex format check only)', async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    // The CIDR validation only checks format (regex), not IP range validity.
    // "999.999.999.999/32" matches the format pattern, so it is accepted.
    const result = await updateAccessRestriction({
      container,
      headers: createMockHeaders(),
      input: {
        ipRestrictionEnabled: true,
        allowedIps: [
          { cidr: "999.999.999.999/32", description: "Format-valid" },
        ],
        basicAuthEnabled: false,
        basicAuthUsername: null,
        basicAuthPassword: null,
      },
    });

    expect(result.allowedIps[0].cidr).toBe("999.999.999.999/32");
  });

  it('should throw BusinessRuleError for invalid CIDR "not-a-cidr"', async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    await expect(
      updateAccessRestriction({
        container,
        headers: createMockHeaders(),
        input: {
          ipRestrictionEnabled: true,
          allowedIps: [{ cidr: "not-a-cidr", description: "Invalid" }],
          basicAuthEnabled: false,
          basicAuthUsername: null,
          basicAuthPassword: null,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw BusinessRuleError for IP without subnet "192.168.1.1"', async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    await expect(
      updateAccessRestriction({
        container,
        headers: createMockHeaders(),
        input: {
          ipRestrictionEnabled: true,
          allowedIps: [{ cidr: "192.168.1.1", description: "No subnet mask" }],
          basicAuthEnabled: false,
          basicAuthUsername: null,
          basicAuthPassword: null,
        },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should update with basicAuth enabled and valid username/password", async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    const result = await updateAccessRestriction({
      container,
      headers: createMockHeaders(),
      input: {
        ipRestrictionEnabled: false,
        allowedIps: [],
        basicAuthEnabled: true,
        basicAuthUsername: "admin",
        basicAuthPassword: "securePassword",
      },
    });

    expect(result.basicAuthEnabled).toBe(true);
    expect(result.basicAuthUsername).toBe("admin");
  });

  it("should throw ValidationError when basicAuth enabled but username is empty", async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    await expect(
      updateAccessRestriction({
        container,
        headers: createMockHeaders(),
        input: {
          ipRestrictionEnabled: false,
          allowedIps: [],
          basicAuthEnabled: true,
          basicAuthUsername: "",
          basicAuthPassword: "password",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when basicAuth enabled but username is null", async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    await expect(
      updateAccessRestriction({
        container,
        headers: createMockHeaders(),
        input: {
          ipRestrictionEnabled: false,
          allowedIps: [],
          basicAuthEnabled: true,
          basicAuthUsername: null,
          basicAuthPassword: "password",
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should update with basicAuth disabled", async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container);

    const result = await updateAccessRestriction({
      container,
      headers: createMockHeaders(),
      input: {
        ipRestrictionEnabled: false,
        allowedIps: [],
        basicAuthEnabled: false,
        basicAuthUsername: null,
        basicAuthPassword: null,
      },
    });

    expect(result.basicAuthEnabled).toBe(false);
  });

  it("should preserve existing password hash when basicAuthPassword is null", async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container, {
      basicAuthEnabled: true,
      basicAuthUsername: "admin",
      basicAuthPasswordHash: "existing-hash",
    });

    const result = await updateAccessRestriction({
      container,
      headers: createMockHeaders(),
      input: {
        ipRestrictionEnabled: false,
        allowedIps: [],
        basicAuthEnabled: true,
        basicAuthUsername: "admin",
        basicAuthPassword: null,
      },
    });

    expect(result.basicAuthEnabled).toBe(true);
    expect(result.basicAuthUsername).toBe("admin");
  });

  it("should hash new password when basicAuthPassword is provided", async () => {
    const container = getContainer();
    await insertAccessRestrictionSetting(container, {
      basicAuthEnabled: true,
      basicAuthUsername: "admin",
      basicAuthPasswordHash: "old-hash",
    });

    const result = await updateAccessRestriction({
      container,
      headers: createMockHeaders(),
      input: {
        ipRestrictionEnabled: false,
        allowedIps: [],
        basicAuthEnabled: true,
        basicAuthUsername: "admin",
        basicAuthPassword: "newPassword123",
      },
    });

    expect(result.basicAuthEnabled).toBe(true);
    expect(result.basicAuthUsername).toBe("admin");
  });

  it("should throw NotFoundError when access_restriction setting does not exist", async () => {
    const container = getContainer();

    await expect(
      updateAccessRestriction({
        container,
        headers: createMockHeaders(),
        input: {
          ipRestrictionEnabled: false,
          allowedIps: [],
          basicAuthEnabled: false,
          basicAuthUsername: null,
          basicAuthPassword: null,
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
