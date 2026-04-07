import { describe, expect, it, vi } from "vitest";
import {
  UnauthenticatedError,
  ValidationError,
} from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { refreshOAuthToken } from "./refreshOAuthToken";

describe("refreshOAuthToken", () => {
  const getContainer = setupTestContainer();

  it("should return new tokens with valid refresh token", async () => {
    const container = getContainer();
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    vi.spyOn(
      container.authenticationProvider,
      "refreshOAuthToken",
    ).mockResolvedValue({
      ok: true,
      value: {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresAt,
        scopes: ["k:app_record:read" as never],
      },
    });

    const result = await refreshOAuthToken({
      container,
      headers: createMockHeaders(),
      input: { refreshToken: "valid-refresh-token" },
    });

    expect(result.accessToken).toBe("new-access-token");
    expect(result.refreshToken).toBe("new-refresh-token");
    expect(result.expiresAt).toEqual(expiresAt);
    expect(result.scopes).toHaveLength(1);
  });

  it("should throw ValidationError when refreshToken is empty", async () => {
    const container = getContainer();

    await expect(
      refreshOAuthToken({
        container,
        headers: createMockHeaders(),
        input: { refreshToken: "" },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw UnauthenticatedError when refresh token is invalid", async () => {
    const container = getContainer();

    vi.spyOn(
      container.authenticationProvider,
      "refreshOAuthToken",
    ).mockResolvedValue({
      ok: false,
      error: { kind: "InvalidToken" as const },
    });

    await expect(
      refreshOAuthToken({
        container,
        headers: createMockHeaders(),
        input: { refreshToken: "invalid-refresh-token" },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it("should throw UnauthenticatedError when refresh token does not exist", async () => {
    const container = getContainer();

    vi.spyOn(
      container.authenticationProvider,
      "refreshOAuthToken",
    ).mockResolvedValue({
      ok: false,
      error: { kind: "InvalidToken" as const },
    });

    await expect(
      refreshOAuthToken({
        container,
        headers: createMockHeaders(),
        input: { refreshToken: "nonexistent-refresh-token" },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it("should throw UnauthenticatedError when old refresh token is used after rotation", async () => {
    const container = getContainer();
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    const spy = vi.spyOn(container.authenticationProvider, "refreshOAuthToken");

    // First call succeeds
    spy.mockResolvedValueOnce({
      ok: true,
      value: {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresAt,
        scopes: ["k:app_record:read" as never],
      },
    });

    await refreshOAuthToken({
      container,
      headers: createMockHeaders(),
      input: { refreshToken: "old-refresh-token" },
    });

    // Second call with old token fails
    spy.mockResolvedValueOnce({
      ok: false,
      error: { kind: "InvalidToken" as const },
    });

    await expect(
      refreshOAuthToken({
        container,
        headers: createMockHeaders(),
        input: { refreshToken: "old-refresh-token" },
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });
});
