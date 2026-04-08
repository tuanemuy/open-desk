import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import {
  createMockHeaders,
  setupTestContainer,
} from "@/core/application/__tests__/helpers";
import { ForbiddenError } from "@/core/application/error";
import { listPlugins } from "./listPlugins";

const getContainer = setupTestContainer();
const headers = () => createMockHeaders();

async function seedUser(
  db: ReturnType<typeof getContainer>["db"],
  id = "user-1",
) {
  await db.insert(schema.users).values({
    id,
    loginName: `login-${id}`,
    displayName: `User ${id}`,
    email: `${id}@test.com`,
    passwordHash: "hash",
  });
}

async function seedSystemPermission(
  db: ReturnType<typeof getContainer>["db"],
  entityCode: string,
  opts: { systemAdmin?: boolean } = {},
) {
  await db.insert(schema.systemPermissions).values({
    entityType: "USER",
    entityCode,
    systemAdmin: opts.systemAdmin ?? true,
  });
}

async function seedPlugin(
  db: ReturnType<typeof getContainer>["db"],
  id: string,
  overrides: {
    name?: string;
    isActive?: boolean;
    isPreinstalled?: boolean;
  } = {},
) {
  await db.insert(schema.plugins).values({
    id,
    name: overrides.name ?? `Plugin ${id}`,
    isActive: overrides.isActive ?? true,
    isPreinstalled: overrides.isPreinstalled ?? false,
  });
}

describe("listPlugins", () => {
  it("should return plugins with totalCount", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedPlugin(container.db, "plugin-1");
    await seedPlugin(container.db, "plugin-2");
    await seedPlugin(container.db, "plugin-3");

    const result = await listPlugins({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
      },
    });

    expect(result.plugins).toHaveLength(3);
    expect(result.totalCount).toBe(3);
  });

  it("should return empty list when no plugins exist", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");

    const result = await listPlugins({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
      },
    });

    expect(result.plugins).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should respect offset and limit for pagination", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");

    for (let i = 0; i < 5; i++) {
      await seedPlugin(container.db, `plugin-${i}`);
    }

    const result = await listPlugins({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
        offset: 2,
        limit: 2,
      },
    });

    expect(result.plugins).toHaveLength(2);
    expect(result.totalCount).toBe(5);
  });

  it("should include isActive and isPreinstalled fields", async () => {
    const container = getContainer();
    await seedUser(container.db);
    await seedSystemPermission(container.db, "login-user-1");
    await seedPlugin(container.db, "plugin-active", {
      isActive: true,
      isPreinstalled: false,
    });
    await seedPlugin(container.db, "plugin-inactive", {
      isActive: false,
      isPreinstalled: false,
    });
    await seedPlugin(container.db, "plugin-preinstalled", {
      isActive: true,
      isPreinstalled: true,
    });

    const result = await listPlugins({
      container,
      headers: headers(),
      input: {
        operatorId: "user-1",
      },
    });

    expect(result.plugins).toHaveLength(3);

    const activePlugin = result.plugins.find(
      (p) => p.pluginId === "plugin-active",
    );
    expect(activePlugin?.isActive).toBe(true);
    expect(activePlugin?.isPreinstalled).toBe(false);

    const inactivePlugin = result.plugins.find(
      (p) => p.pluginId === "plugin-inactive",
    );
    expect(inactivePlugin?.isActive).toBe(false);

    const preinstalledPlugin = result.plugins.find(
      (p) => p.pluginId === "plugin-preinstalled",
    );
    expect(preinstalledPlugin?.isPreinstalled).toBe(true);
  });

  it("should throw ForbiddenError when operator lacks system admin permission", async () => {
    const container = getContainer();
    await seedUser(container.db);
    // No system permission

    await expect(
      listPlugins({
        container,
        headers: headers(),
        input: {
          operatorId: "user-1",
        },
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
