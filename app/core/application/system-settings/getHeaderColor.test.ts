import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { getHeaderColor } from "./getHeaderColor";

describe("getHeaderColor", () => {
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

  it("should return hex when header_color setting exists", async () => {
    const container = getContainer();
    await insertHeaderColorSetting(container, "#ffcc00");

    const result = await getHeaderColor({
      container,
      headers: createMockHeaders(),
      input: undefined,
    });

    expect(result.hex).toBe("#ffcc00");
  });

  it("should throw NotFoundError when header_color setting does not exist", async () => {
    const container = getContainer();

    await expect(
      getHeaderColor({
        container,
        headers: createMockHeaders(),
        input: undefined,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
