import { describe, expect, it } from "vitest";
import { ScryptBearerTokenHasher } from "@/core/adapters/drizzleSqlite/repositories/bearerTokenHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updateProvisioningConfig } from "./updateProvisioningConfig";

describe("updateProvisioningConfig", () => {
  const getContainer = setupTestContainer();
  const tokenHasher = new ScryptBearerTokenHasher();

  async function insertConfigWithToken(
    container: ReturnType<typeof getContainer>,
    isEnabled: boolean,
  ) {
    const token = tokenHasher.generate();
    const hashed = tokenHasher.hash(token);
    const now = new Date();
    await container.db.insert(schema.provisioningConfigs).values({
      id: crypto.randomUUID(),
      isEnabled,
      bearerTokenHash: hashed.value,
      bearerTokenAlgorithm: hashed.algorithm,
      tokenIssuedAt: now,
    });
    return token;
  }

  it("should enable provisioning when disabled with token set", async () => {
    const container = getContainer();
    await insertConfigWithToken(container, false);

    const result = await updateProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: { isEnabled: true },
    });

    expect(result.isEnabled).toBe(true);
    expect(result.hasToken).toBe(true);
    expect(result.updatedAt).toBeDefined();
    expect(result.generatedToken).toBeNull();
  });

  it("should disable provisioning when enabled", async () => {
    const container = getContainer();
    await insertConfigWithToken(container, true);

    const result = await updateProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: { isEnabled: false },
    });

    expect(result.isEnabled).toBe(false);
    expect(result.updatedAt).toBeDefined();
    expect(result.generatedToken).toBeNull();
  });

  it("should generate new token when regenerateToken=true (no existing token)", async () => {
    const container = getContainer();
    // Default config has no token

    const result = await updateProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: { regenerateToken: true },
    });

    expect(result.hasToken).toBe(true);
    expect(result.tokenIssuedAt).toBeDefined();
    expect(result.generatedToken).toBeDefined();
    expect(result.generatedToken).not.toBeNull();
    expect(typeof result.generatedToken).toBe("string");
    expect((result.generatedToken as string).length).toBeGreaterThan(0);
  });

  it("should regenerate token when regenerateToken=true with existing token", async () => {
    const container = getContainer();
    await insertConfigWithToken(container, true);

    const result = await updateProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: { regenerateToken: true },
    });

    expect(result.hasToken).toBe(true);
    expect(result.generatedToken).toBeDefined();
    expect(result.generatedToken).not.toBeNull();
  });

  it("should regenerate token and enable simultaneously", async () => {
    const container = getContainer();
    // Default config: disabled, no token

    const result = await updateProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: { regenerateToken: true, isEnabled: true },
    });

    expect(result.isEnabled).toBe(true);
    expect(result.hasToken).toBe(true);
    expect(result.generatedToken).not.toBeNull();
  });

  it("should throw BusinessRuleError when enabling without token configured", async () => {
    const container = getContainer();
    // Default config: disabled, no token

    await expect(
      updateProvisioningConfig({
        container,
        headers: createMockHeaders(),
        input: { isEnabled: true },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when enabling already enabled provisioning", async () => {
    const container = getContainer();
    await insertConfigWithToken(container, true);

    await expect(
      updateProvisioningConfig({
        container,
        headers: createMockHeaders(),
        input: { isEnabled: true },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when disabling already disabled provisioning", async () => {
    const container = getContainer();
    // Default config: disabled

    await expect(
      updateProvisioningConfig({
        container,
        headers: createMockHeaders(),
        input: { isEnabled: false },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should return current state when no changes specified", async () => {
    const container = getContainer();

    const result = await updateProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: {},
    });

    expect(result.isEnabled).toBe(false);
    expect(result.hasToken).toBe(false);
    expect(result.generatedToken).toBeNull();
  });

  it("should return generatedToken as null when regenerateToken=false", async () => {
    const container = getContainer();
    await insertConfigWithToken(container, false);

    const result = await updateProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: { regenerateToken: false },
    });

    expect(result.generatedToken).toBeNull();
  });
});
