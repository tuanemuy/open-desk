import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updateGroup } from "./updateGroup";

describe("updateGroup", () => {
  const getContainer = setupTestContainer();

  async function insertGroup(container: ReturnType<typeof getContainer>) {
    const groupId = crypto.randomUUID();
    await container.db.insert(schema.groups).values({
      id: groupId,
      name: "Original Name",
      code: `code-${groupId}`,
    });
    return groupId;
  }

  it("should update group name", async () => {
    const container = getContainer();
    const groupId = await insertGroup(container);

    const result = await updateGroup({
      container,
      headers: createMockHeaders(),
      input: { groupId, name: "New Name" },
    });

    expect(result.groupId).toBe(groupId);
    expect(result.name).toBe("New Name");
  });

  it("should throw ValidationError when groupId is empty", async () => {
    const container = getContainer();

    await expect(
      updateGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId: "", name: "New Name" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw error when groupId is not UUID format", async () => {
    const container = getContainer();

    await expect(
      updateGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId: "not-uuid", name: "New Name" },
      }),
    ).rejects.toThrow();
  });

  it("should throw BusinessRuleError when name is empty", async () => {
    const container = getContainer();
    const groupId = await insertGroup(container);

    await expect(
      updateGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId, name: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError when group does not exist", async () => {
    const container = getContainer();

    await expect(
      updateGroup({
        container,
        headers: createMockHeaders(),
        input: { groupId: crypto.randomUUID(), name: "New Name" },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should succeed when updating with same name (no change)", async () => {
    const container = getContainer();
    const groupId = await insertGroup(container);

    const result = await updateGroup({
      container,
      headers: createMockHeaders(),
      input: { groupId, name: "Original Name" },
    });

    expect(result.name).toBe("Original Name");
  });
});
