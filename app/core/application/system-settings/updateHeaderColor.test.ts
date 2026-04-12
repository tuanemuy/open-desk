import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError } from "@/core/application/error";
import { BusinessRuleError } from "@/core/domain/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updateHeaderColor } from "./updateHeaderColor";

describe("updateHeaderColor", () => {
  const getContainer = setupTestContainer();

  async function insertHeaderColorSetting(
    container: ReturnType<typeof getContainer>,
    hex: string,
  ) {
    const settingId = crypto.randomUUID();
    await container.db.insert(schema.systemSettings).values({
      id: settingId,
      key: "header_color",
      value: { hex },
    });
    return settingId;
  }

  it('should update with valid HEX code "#ff0000"', async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#000000");

    const result = await updateHeaderColor({
      container,
      headers: createMockHeaders(),
      input: { hex: "#ff0000" },
    });

    expect(result.hex).toBe("#ff0000");
  });

  it('should update with lowercase HEX code "#aabbcc"', async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#000000");

    const result = await updateHeaderColor({
      container,
      headers: createMockHeaders(),
      input: { hex: "#aabbcc" },
    });

    expect(result.hex).toBe("#aabbcc");
  });

  it('should update with uppercase HEX code "#AABBCC"', async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#000000");

    const result = await updateHeaderColor({
      container,
      headers: createMockHeaders(),
      input: { hex: "#AABBCC" },
    });

    expect(result.hex).toBe("#AABBCC");
  });

  it('should update with mixed-case HEX code "#aAbBcC"', async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#000000");

    const result = await updateHeaderColor({
      container,
      headers: createMockHeaders(),
      input: { hex: "#aAbBcC" },
    });

    expect(result.hex).toBe("#aAbBcC");
  });

  it('should throw BusinessRuleError for HEX without "#" prefix "ff0000"', async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#000000");

    await expect(
      updateHeaderColor({
        container,
        headers: createMockHeaders(),
        input: { hex: "ff0000" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw BusinessRuleError for 3-digit shorthand "#fff"', async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#000000");

    await expect(
      updateHeaderColor({
        container,
        headers: createMockHeaders(),
        input: { hex: "#fff" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw BusinessRuleError for 8-digit (alpha) "#ff000000"', async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#000000");

    await expect(
      updateHeaderColor({
        container,
        headers: createMockHeaders(),
        input: { hex: "#ff000000" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('should throw BusinessRuleError for invalid characters "#gggggg"', async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#000000");

    await expect(
      updateHeaderColor({
        container,
        headers: createMockHeaders(),
        input: { hex: "#gggggg" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw BusinessRuleError for empty string", async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#000000");

    await expect(
      updateHeaderColor({
        container,
        headers: createMockHeaders(),
        input: { hex: "" },
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it("should throw NotFoundError when header_color setting does not exist", async () => {
    const container = getContainer();

    await expect(
      updateHeaderColor({
        container,
        headers: createMockHeaders(),
        input: { hex: "#ff0000" },
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
