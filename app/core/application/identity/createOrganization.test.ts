import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { createOrganization } from "./createOrganization";

describe("createOrganization", () => {
  const getContainer = setupTestContainer();

  async function insertOrganization(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<{
      id: string;
      name: string;
      code: string;
      parentOrganizationId: string | null;
    }> = {},
  ) {
    const orgId = overrides.id ?? crypto.randomUUID();
    await container.db.insert(schema.organizations).values({
      id: orgId,
      name: overrides.name ?? "Test Org",
      code: overrides.code ?? `org-${orgId}`,
      parentOrganizationId: overrides.parentOrganizationId ?? null,
    });
    return orgId;
  }

  it("should create root organization", async () => {
    const container = getContainer();

    const result = await createOrganization({
      container,
      headers: createMockHeaders(),
      input: { name: "Root Org", code: "root" },
    });

    expect(result.organizationId).toBeDefined();
    expect(result.name).toBe("Root Org");
    expect(result.code).toBe("root");
    expect(result.parentOrganizationId).toBeNull();
    expect(result.orderIndex).toBe(0);
  });

  it("should create child organization with parent", async () => {
    const container = getContainer();
    const parentId = await insertOrganization(container);

    const result = await createOrganization({
      container,
      headers: createMockHeaders(),
      input: {
        name: "Child Org",
        code: "child",
        parentOrganizationId: parentId,
      },
    });

    expect(result.parentOrganizationId).toBe(parentId);
  });

  it("should create organization with orderIndex 5", async () => {
    const container = getContainer();

    const result = await createOrganization({
      container,
      headers: createMockHeaders(),
      input: { name: "Ordered Org", code: "ordered", orderIndex: 5 },
    });

    expect(result.orderIndex).toBe(5);
  });

  it("should default orderIndex to 0 when omitted", async () => {
    const container = getContainer();

    const result = await createOrganization({
      container,
      headers: createMockHeaders(),
      input: { name: "Default Order", code: "default-order" },
    });

    expect(result.orderIndex).toBe(0);
  });

  it("should throw ValidationError when name is empty", async () => {
    const container = getContainer();

    await expect(
      createOrganization({
        container,
        headers: createMockHeaders(),
        input: { name: "", code: "code" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when code is empty", async () => {
    const container = getContainer();

    await expect(
      createOrganization({
        container,
        headers: createMockHeaders(),
        input: { name: "Name", code: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when parentOrganizationId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      createOrganization({
        container,
        headers: createMockHeaders(),
        input: {
          name: "Name",
          code: "code",
          parentOrganizationId: "not-uuid",
        },
      }),
    ).rejects.toThrow();
  });

  it("should throw ValidationError when orderIndex is negative", async () => {
    const container = getContainer();

    await expect(
      createOrganization({
        container,
        headers: createMockHeaders(),
        input: { name: "Name", code: "code", orderIndex: -1 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError when parent organization does not exist", async () => {
    const container = getContainer();

    await expect(
      createOrganization({
        container,
        headers: createMockHeaders(),
        input: {
          name: "Child Org",
          code: "child",
          parentOrganizationId: crypto.randomUUID(),
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError when code already exists", async () => {
    const container = getContainer();
    await insertOrganization(container, { code: "existing" });

    await expect(
      createOrganization({
        container,
        headers: createMockHeaders(),
        input: { name: "New Org", code: "existing" },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should create organization with orderIndex 0 (boundary)", async () => {
    const container = getContainer();

    const result = await createOrganization({
      container,
      headers: createMockHeaders(),
      input: { name: "Zero Order", code: "zero-order", orderIndex: 0 },
    });

    expect(result.orderIndex).toBe(0);
  });
});
