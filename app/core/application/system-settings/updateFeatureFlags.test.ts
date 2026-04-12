import { describe, expect, it } from "vitest";
import * as schema from "@/core/adapters/drizzleSqlite/schema";
import { NotFoundError, ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { updateFeatureFlags } from "./updateFeatureFlags";

describe("updateFeatureFlags", () => {
  const getContainer = setupTestContainer();

  const defaultInput = {
    emailNotification: {
      enabled: true,
      defaultReceive: "SELF_ONLY",
      format: "HTML",
      allowUserFormatChange: true,
      notifyRestApi: false,
    },
    space: {
      enabled: true,
      allowStandaloneApp: false,
    },
    guestSpace: {
      enabled: false,
    },
    peopleAndMessage: {
      enabled: true,
    },
    usageDashboard: {
      enabled: true,
    },
  };

  async function insertFeatureFlagsSetting(
    container: ReturnType<typeof getContainer>,
  ) {
    const settingId = crypto.randomUUID();
    await container.db.insert(schema.systemSettings).values({
      id: settingId,
      key: "feature_flags",
      value: defaultInput,
    });
    return settingId;
  }

  it("should update with all features enabled", async () => {
    const container = getContainer();
    await insertFeatureFlagsSetting(container);

    const input = {
      emailNotification: {
        enabled: true,
        defaultReceive: "SELF_ONLY",
        format: "HTML",
        allowUserFormatChange: true,
        notifyRestApi: true,
      },
      space: {
        enabled: true,
        allowStandaloneApp: true,
      },
      guestSpace: {
        enabled: true,
      },
      peopleAndMessage: {
        enabled: true,
      },
      usageDashboard: {
        enabled: true,
      },
    };

    const result = await updateFeatureFlags({
      container,
      headers: createMockHeaders(),
      input,
    });

    expect(result.emailNotification.enabled).toBe(true);
    expect(result.space.enabled).toBe(true);
    expect(result.space.allowStandaloneApp).toBe(true);
    expect(result.guestSpace.enabled).toBe(true);
    expect(result.peopleAndMessage.enabled).toBe(true);
    expect(result.usageDashboard.enabled).toBe(true);
  });

  it("should update with all features disabled", async () => {
    const container = getContainer();
    await insertFeatureFlagsSetting(container);

    const input = {
      emailNotification: {
        enabled: false,
        defaultReceive: "NONE",
        format: "TEXT",
        allowUserFormatChange: false,
        notifyRestApi: false,
      },
      space: {
        enabled: false,
        allowStandaloneApp: false,
      },
      guestSpace: {
        enabled: false,
      },
      peopleAndMessage: {
        enabled: false,
      },
      usageDashboard: {
        enabled: false,
      },
    };

    const result = await updateFeatureFlags({
      container,
      headers: createMockHeaders(),
      input,
    });

    expect(result.emailNotification.enabled).toBe(false);
    expect(result.space.enabled).toBe(false);
    expect(result.guestSpace.enabled).toBe(false);
    expect(result.peopleAndMessage.enabled).toBe(false);
    expect(result.usageDashboard.enabled).toBe(false);
  });

  it('should update defaultReceive to "SELF_ONLY"', async () => {
    const container = getContainer();
    await insertFeatureFlagsSetting(container);

    const result = await updateFeatureFlags({
      container,
      headers: createMockHeaders(),
      input: {
        ...defaultInput,
        emailNotification: {
          ...defaultInput.emailNotification,
          defaultReceive: "SELF_ONLY",
        },
      },
    });

    expect(result.emailNotification.defaultReceive).toBe("SELF_ONLY");
  });

  it('should update defaultReceive to "NONE"', async () => {
    const container = getContainer();
    await insertFeatureFlagsSetting(container);

    const result = await updateFeatureFlags({
      container,
      headers: createMockHeaders(),
      input: {
        ...defaultInput,
        emailNotification: {
          ...defaultInput.emailNotification,
          defaultReceive: "NONE",
        },
      },
    });

    expect(result.emailNotification.defaultReceive).toBe("NONE");
  });

  it('should update format to "HTML"', async () => {
    const container = getContainer();
    await insertFeatureFlagsSetting(container);

    const result = await updateFeatureFlags({
      container,
      headers: createMockHeaders(),
      input: {
        ...defaultInput,
        emailNotification: {
          ...defaultInput.emailNotification,
          format: "HTML",
        },
      },
    });

    expect(result.emailNotification.format).toBe("HTML");
  });

  it('should update format to "TEXT"', async () => {
    const container = getContainer();
    await insertFeatureFlagsSetting(container);

    const result = await updateFeatureFlags({
      container,
      headers: createMockHeaders(),
      input: {
        ...defaultInput,
        emailNotification: {
          ...defaultInput.emailNotification,
          format: "TEXT",
        },
      },
    });

    expect(result.emailNotification.format).toBe("TEXT");
  });

  it("should update space.allowStandaloneApp to true", async () => {
    const container = getContainer();
    await insertFeatureFlagsSetting(container);

    const result = await updateFeatureFlags({
      container,
      headers: createMockHeaders(),
      input: {
        ...defaultInput,
        space: { enabled: true, allowStandaloneApp: true },
      },
    });

    expect(result.space.allowStandaloneApp).toBe(true);
  });

  it("should throw ValidationError for invalid defaultReceive value", async () => {
    const container = getContainer();
    await insertFeatureFlagsSetting(container);

    await expect(
      updateFeatureFlags({
        container,
        headers: createMockHeaders(),
        input: {
          ...defaultInput,
          emailNotification: {
            ...defaultInput.emailNotification,
            defaultReceive: "INVALID_VALUE",
          },
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError for invalid format value", async () => {
    const container = getContainer();
    await insertFeatureFlagsSetting(container);

    await expect(
      updateFeatureFlags({
        container,
        headers: createMockHeaders(),
        input: {
          ...defaultInput,
          emailNotification: {
            ...defaultInput.emailNotification,
            format: "INVALID_FORMAT",
          },
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError when feature_flags setting does not exist", async () => {
    const container = getContainer();

    await expect(
      updateFeatureFlags({
        container,
        headers: createMockHeaders(),
        input: defaultInput,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
