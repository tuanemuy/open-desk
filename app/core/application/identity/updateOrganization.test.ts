import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updateOrganization } from "./updateOrganization";

describe("updateOrganization", () => {
  const getContainer = setupTestContainer();

  async function insertOrganization(
    container: ReturnType<typeof getContainer>,
    overrides: Partial<{
      id: string;
      name: string;
      code: string;
      parentOrganizationId: string | null;
      orderIndex: number;
    }> = {},
  ) {
    const orgId = overrides.id ?? crypto.randomUUID();
    await container.db.insert(schema.organizations).values({
      id: orgId,
      name: overrides.name ?? "Test Org",
      code: overrides.code ?? `org-${orgId}`,
      parentOrganizationId: overrides.parentOrganizationId ?? null,
      orderIndex: overrides.orderIndex ?? 0,
    });
    return orgId;
  }

  it("should update organization name", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);

    const result = await updateOrganization({
      container,
      headers: createMockHeaders(),
      input: { organizationId: orgId, name: "Updated Name" },
    });

    expect(result.name).toBe("Updated Name");
  });

  it("should move child to new parent", async () => {
    const container = getContainer();
    const parentA = await insertOrganization(container);
    const parentB = await insertOrganization(container);
    const child = await insertOrganization(container, {
      parentOrganizationId: parentA,
    });

    const result = await updateOrganization({
      container,
      headers: createMockHeaders(),
      input: { organizationId: child, parentOrganizationId: parentB },
    });

    expect(result.parentOrganizationId).toBe(parentB);
  });

  it("should move child to root (null parent)", async () => {
    const container = getContainer();
    const parent = await insertOrganization(container);
    const child = await insertOrganization(container, {
      parentOrganizationId: parent,
    });

    const result = await updateOrganization({
      container,
      headers: createMockHeaders(),
      input: { organizationId: child, parentOrganizationId: null },
    });

    expect(result.parentOrganizationId).toBeNull();
  });

  it("should update orderIndex", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);

    const result = await updateOrganization({
      container,
      headers: createMockHeaders(),
      input: { organizationId: orgId, orderIndex: 10 },
    });

    expect(result.orderIndex).toBe(10);
  });

  it("should update all fields simultaneously", async () => {
    const container = getContainer();
    const parent = await insertOrganization(container);
    const orgId = await insertOrganization(container);

    const result = await updateOrganization({
      container,
      headers: createMockHeaders(),
      input: {
        organizationId: orgId,
        name: "Updated Name",
        parentOrganizationId: parent,
        orderIndex: 5,
      },
    });

    expect(result.name).toBe("Updated Name");
    expect(result.parentOrganizationId).toBe(parent);
    expect(result.orderIndex).toBe(5);
  });

  it("should throw ValidationError when organizationId is empty", async () => {
    const container = getContainer();

    await expect(
      updateOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: "", name: "New Name" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when organizationId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      updateOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: "not-uuid", name: "New Name" },
      }),
    ).rejects.toThrow();
  });

  it("should throw BusinessRuleError when name is empty", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);

    await expect(
      updateOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: orgId, name: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError when orderIndex is negative", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);

    await expect(
      updateOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: orgId, orderIndex: -1 },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError when organization does not exist", async () => {
    const container = getContainer();

    await expect(
      updateOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: crypto.randomUUID(), name: "New" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when parent organization does not exist", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);

    await expect(
      updateOrganization({
        container,
        headers: createMockHeaders(),
        input: {
          organizationId: orgId,
          parentOrganizationId: crypto.randomUUID(),
        },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError for circular reference: A -> B, move A under B", async () => {
    const container = getContainer();
    const orgA = await insertOrganization(container);
    const orgB = await insertOrganization(container, {
      parentOrganizationId: orgA,
    });

    await expect(
      updateOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: orgA, parentOrganizationId: orgB },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw error when moving organization to itself as parent", async () => {
    const container = getContainer();
    const orgId = await insertOrganization(container);

    await expect(
      updateOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: orgId, parentOrganizationId: orgId },
      }),
    ).rejects.toThrow();
  });

  it("should throw error for circular reference: A -> B -> C, move A under C", async () => {
    const container = getContainer();
    const orgA = await insertOrganization(container);
    const orgB = await insertOrganization(container, {
      parentOrganizationId: orgA,
    });
    const orgC = await insertOrganization(container, {
      parentOrganizationId: orgB,
    });

    await expect(
      updateOrganization({
        container,
        headers: createMockHeaders(),
        input: { organizationId: orgA, parentOrganizationId: orgC },
      }),
    ).rejects.toThrow(ConflictError);
  });
});
