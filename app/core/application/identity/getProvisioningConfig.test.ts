import { describe, expect, it } from "vitest";
import { ScryptBearerTokenHasher } from "@/core/adapters/drizzleSqlite/repositories/bearerTokenHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { getProvisioningConfig } from "./getProvisioningConfig";

describe("getProvisioningConfig", () => {
  const getContainer = setupTestContainer();
  const tokenHasher = new ScryptBearerTokenHasher();

  it("should return default config (disabled, no token) on initial state", async () => {
    const container = getContainer();

    const result = await getProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.isEnabled).toBe(false);
    expect(result.hasToken).toBe(false);
    expect(result.tokenIssuedAt).toBeNull();
    expect(result.updatedAt).toBeDefined();
  });

  it("should return isEnabled=true and hasToken=true when provisioning is enabled with token", async () => {
    const container = getContainer();
    const token = tokenHasher.generate();
    const hashed = tokenHasher.hash(token);
    const now = new Date();

    // Insert a provisioning config directly
    await container.db.insert(schema.provisioningConfigs).values({
      id: crypto.randomUUID(),
      isEnabled: true,
      bearerTokenHash: hashed.value,
      bearerTokenAlgorithm: hashed.algorithm,
      tokenIssuedAt: now,
    });

    const result = await getProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.isEnabled).toBe(true);
    expect(result.hasToken).toBe(true);
    expect(result.tokenIssuedAt).toBeDefined();
  });

  it("should return isEnabled=false and hasToken=true when disabled but token is set", async () => {
    const container = getContainer();
    const token = tokenHasher.generate();
    const hashed = tokenHasher.hash(token);
    const now = new Date();

    await container.db.insert(schema.provisioningConfigs).values({
      id: crypto.randomUUID(),
      isEnabled: false,
      bearerTokenHash: hashed.value,
      bearerTokenAlgorithm: hashed.algorithm,
      tokenIssuedAt: now,
    });

    const result = await getProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.isEnabled).toBe(false);
    expect(result.hasToken).toBe(true);
    expect(result.tokenIssuedAt).toBeDefined();
  });

  it("should not expose bearer token plaintext in output (only hasToken)", async () => {
    const container = getContainer();
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

    const result = await getProvisioningConfig({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    // The output should only have hasToken, not the actual token or hash
    expect(result.hasToken).toBe(true);
    expect(result).not.toHaveProperty("bearerToken");
    expect(result).not.toHaveProperty("bearerTokenHash");
  });
});
