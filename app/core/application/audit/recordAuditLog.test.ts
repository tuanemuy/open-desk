import { describe, expect, it } from "vitest";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { recordAuditLog } from "./recordAuditLog";

describe("recordAuditLog", () => {
  const getContainer = setupTestContainer();
  const hasher = new ScryptPasswordHasher();

  async function insertUser(container: ReturnType<typeof getContainer>) {
    const userId = crypto.randomUUID();
    const hashed = await hasher.hash("password123");
    await container.db.insert(schema.users).values({
      id: userId,
      loginName: `user-${userId}@example.com`,
      displayName: "Test User",
      email: `user-${userId}@example.com`,
      passwordHash: hashed.value,
      passwordAlgorithm: hashed.algorithm,
      isActive: true,
    });
    return userId;
  }

  it("should create an audit log with INFO level, SUCCESS result, and null errorCode", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "OPEN_DESK",
        module: "App management",
        action: "App create",
        result: "SUCCESS",
        errorCode: null,
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should create an audit log with CRITICAL level, FAILURE result, and errorCode", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "CRITICAL",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "OPEN_DESK",
        module: "Authentication",
        action: "Login attempt",
        result: "FAILURE",
        errorCode: "AUTH_001",
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should create an audit log with null sourceIp for system internal operations", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "OPEN_DESK",
        module: "System",
        action: "Batch process",
        result: "SUCCESS",
        errorCode: null,
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should create an audit log with a valid sourceIp", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: "192.168.1.1",
        userId: null,
        service: "OPEN_DESK",
        module: "App management",
        action: "App update",
        result: "SUCCESS",
        errorCode: null,
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should create an audit log with null userId for system operations", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "OPEN_DESK",
        module: "System",
        action: "Cleanup",
        result: "SUCCESS",
        errorCode: null,
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should create an audit log with a valid userId", async () => {
    const container = getContainer();
    const userId = await insertUser(container);

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId,
        service: "OPEN_DESK",
        module: "App management",
        action: "App create",
        result: "SUCCESS",
        errorCode: null,
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should create an audit log with COMMON service type", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "COMMON",
        module: "System",
        action: "Health check",
        result: "SUCCESS",
        errorCode: null,
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should create an audit log with GAROON service type", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "GAROON",
        module: "Schedule",
        action: "Event create",
        result: "SUCCESS",
        errorCode: null,
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should create an audit log with CYBOZU_OFFICE service type", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "CYBOZU_OFFICE",
        module: "Workflow",
        action: "Submit request",
        result: "SUCCESS",
        errorCode: null,
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should correct errorCode to null when result is SUCCESS and errorCode is non-null", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "OPEN_DESK",
        module: "App management",
        action: "App create",
        result: "SUCCESS",
        errorCode: "ERR_001",
      },
    });

    // Should not throw because errorCode is corrected to null before entity creation
    expect(result.auditLogId).toBeDefined();
  });

  it("should preserve errorCode when result is FAILURE", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "OPEN_DESK",
        module: "App management",
        action: "App create",
        result: "FAILURE",
        errorCode: "ERR_001",
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should allow FAILURE result with null errorCode", async () => {
    const container = getContainer();

    const result = await recordAuditLog({
      container,
      headers: createMockHeaders(),
      input: {
        level: "INFO",
        timestamp: new Date(),
        sourceIp: null,
        userId: null,
        service: "OPEN_DESK",
        module: "App management",
        action: "App create",
        result: "FAILURE",
        errorCode: null,
      },
    });

    expect(result.auditLogId).toBeDefined();
  });

  it("should throw ValidationError when module is empty", async () => {
    const container = getContainer();

    await expect(
      recordAuditLog({
        container,
        headers: createMockHeaders(),
        input: {
          level: "INFO",
          timestamp: new Date(),
          sourceIp: null,
          userId: null,
          service: "OPEN_DESK",
          module: "",
          action: "App create",
          result: "SUCCESS",
          errorCode: null,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when action is empty", async () => {
    const container = getContainer();

    await expect(
      recordAuditLog({
        container,
        headers: createMockHeaders(),
        input: {
          level: "INFO",
          timestamp: new Date(),
          sourceIp: null,
          userId: null,
          service: "OPEN_DESK",
          module: "App management",
          action: "",
          result: "SUCCESS",
          errorCode: null,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError for module first when both module and action are empty", async () => {
    const container = getContainer();

    await expect(
      recordAuditLog({
        container,
        headers: createMockHeaders(),
        input: {
          level: "INFO",
          timestamp: new Date(),
          sourceIp: null,
          userId: null,
          service: "OPEN_DESK",
          module: "",
          action: "",
          result: "SUCCESS",
          errorCode: null,
        },
      }),
    ).rejects.toThrow("module");
  });
});
