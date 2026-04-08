import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updatePasswordPolicy } from "./updatePasswordPolicy";

describe("updatePasswordPolicy", () => {
  const getContainer = setupTestContainer();

  const defaultInput = {
    userMinLength: 8,
    adminMinLength: 10,
    complexity: "ALPHANUMERIC" as const,
    allowSameAsLoginName: false,
    expirationDays: 90,
    historyCount: 3,
    allowUserChange: true,
    requireChangeOnNextLogin: false,
    allowUserReset: true,
  };

  async function insertPasswordPolicySetting(
    container: ReturnType<typeof getContainer>,
  ) {
    const settingId = crypto.randomUUID();
    await container.db.insert(schema.systemSettings).values({
      id: settingId,
      key: "password_policy",
      value: defaultInput,
    });
    return settingId;
  }

  it("should update with all valid fields", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: {
        userMinLength: 10,
        adminMinLength: 12,
        complexity: "ALPHANUMERIC_SPECIAL",
        allowSameAsLoginName: true,
        expirationDays: 180,
        historyCount: 5,
        allowUserChange: false,
        requireChangeOnNextLogin: true,
        allowUserReset: false,
      },
    });

    expect(result.userMinLength).toBe(10);
    expect(result.adminMinLength).toBe(12);
    expect(result.complexity).toBe("ALPHANUMERIC_SPECIAL");
    expect(result.allowSameAsLoginName).toBe(true);
    expect(result.expirationDays).toBe(180);
    expect(result.historyCount).toBe(5);
    expect(result.allowUserChange).toBe(false);
    expect(result.requireChangeOnNextLogin).toBe(true);
    expect(result.allowUserReset).toBe(false);
  });

  // userMinLength boundary tests
  it("should accept userMinLength at minimum (3)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, userMinLength: 3 },
    });

    expect(result.userMinLength).toBe(3);
  });

  it("should accept userMinLength at maximum (15)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, userMinLength: 15 },
    });

    expect(result.userMinLength).toBe(15);
  });

  it("should throw BusinessRuleError when userMinLength is below minimum (2)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    await expect(
      updatePasswordPolicy({
        container,
        headers: createMockHeaders(),
        input: { ...defaultInput, userMinLength: 2 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when userMinLength exceeds maximum (16)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    await expect(
      updatePasswordPolicy({
        container,
        headers: createMockHeaders(),
        input: { ...defaultInput, userMinLength: 16 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  // adminMinLength boundary tests
  it("should accept adminMinLength at minimum (3)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, adminMinLength: 3 },
    });

    expect(result.adminMinLength).toBe(3);
  });

  it("should accept adminMinLength at maximum (15)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, adminMinLength: 15 },
    });

    expect(result.adminMinLength).toBe(15);
  });

  it("should throw BusinessRuleError when adminMinLength is below minimum (2)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    await expect(
      updatePasswordPolicy({
        container,
        headers: createMockHeaders(),
        input: { ...defaultInput, adminMinLength: 2 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when adminMinLength exceeds maximum (16)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    await expect(
      updatePasswordPolicy({
        container,
        headers: createMockHeaders(),
        input: { ...defaultInput, adminMinLength: 16 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  // historyCount boundary tests
  it("should accept historyCount at minimum (0)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, historyCount: 0 },
    });

    expect(result.historyCount).toBe(0);
  });

  it("should accept historyCount at maximum (15)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, historyCount: 15 },
    });

    expect(result.historyCount).toBe(15);
  });

  it("should throw BusinessRuleError when historyCount is below minimum (-1)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    await expect(
      updatePasswordPolicy({
        container,
        headers: createMockHeaders(),
        input: { ...defaultInput, historyCount: -1 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when historyCount exceeds maximum (16)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    await expect(
      updatePasswordPolicy({
        container,
        headers: createMockHeaders(),
        input: { ...defaultInput, historyCount: 16 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  // complexity tests
  it('should accept complexity "NONE"', async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, complexity: "NONE" },
    });

    expect(result.complexity).toBe("NONE");
  });

  it('should accept complexity "ALPHANUMERIC"', async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, complexity: "ALPHANUMERIC" },
    });

    expect(result.complexity).toBe("ALPHANUMERIC");
  });

  it('should accept complexity "ALPHANUMERIC_SPECIAL"', async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, complexity: "ALPHANUMERIC_SPECIAL" },
    });

    expect(result.complexity).toBe("ALPHANUMERIC_SPECIAL");
  });

  // expirationDays tests
  it("should accept expirationDays as null (no expiration)", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, expirationDays: null },
    });

    expect(result.expirationDays).toBeNull();
  });

  it("should accept expirationDays as a positive integer", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, expirationDays: 90 },
    });

    expect(result.expirationDays).toBe(90);
  });

  // allowSameAsLoginName tests
  it("should accept allowSameAsLoginName true", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, allowSameAsLoginName: true },
    });

    expect(result.allowSameAsLoginName).toBe(true);
  });

  it("should accept allowSameAsLoginName false", async () => {
    const container = getContainer();
    await insertPasswordPolicySetting(container);

    const result = await updatePasswordPolicy({
      container,
      headers: createMockHeaders(),
      input: { ...defaultInput, allowSameAsLoginName: false },
    });

    expect(result.allowSameAsLoginName).toBe(false);
  });

  // NotFound test
  it("should throw NotFoundError when password_policy setting does not exist", async () => {
    const container = getContainer();

    await expect(
      updatePasswordPolicy({
        container,
        headers: createMockHeaders(),
        input: defaultInput,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
