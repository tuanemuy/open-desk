import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/application/error";
import { createMockHeaders, setupTestContainer } from "../__tests__/helpers";
import { listGuestUsers } from "./listGuestUsers";

describe("listGuestUsers", () => {
  const getContainer = setupTestContainer();

  it("should return empty result when no guest users exist", async () => {
    const container = getContainer();

    const result = await listGuestUsers({
      container,
      headers: createMockHeaders(),
      input: {},
    });

    expect(result.guestUsers).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.trialCount).toBe(0);
    expect(result.paidCount).toBe(0);
    expect(result.licensedCount).toBe(0);
  });

  it("should use default offset=0 and limit=100 when omitted", async () => {
    const container = getContainer();

    const result = await listGuestUsers({
      container,
      headers: createMockHeaders(),
      input: {},
    });

    expect(result.guestUsers).toBeDefined();
    expect(result.totalCount).toBe(0);
  });

  it("should throw ValidationError when offset is negative", async () => {
    const container = getContainer();

    await expect(
      listGuestUsers({
        container,
        headers: createMockHeaders(),
        input: { offset: -1 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 0", async () => {
    const container = getContainer();

    await expect(
      listGuestUsers({
        container,
        headers: createMockHeaders(),
        input: { limit: 0 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when limit is 101", async () => {
    const container = getContainer();

    await expect(
      listGuestUsers({
        container,
        headers: createMockHeaders(),
        input: { limit: 101 },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should accept limit=1 (boundary value)", async () => {
    const container = getContainer();

    const result = await listGuestUsers({
      container,
      headers: createMockHeaders(),
      input: { limit: 1 },
    });

    expect(result.guestUsers).toBeDefined();
  });

  it("should accept limit=100 (boundary value)", async () => {
    const container = getContainer();

    const result = await listGuestUsers({
      container,
      headers: createMockHeaders(),
      input: { limit: 100 },
    });

    expect(result.guestUsers).toBeDefined();
  });

  it("should accept offset=0 and limit=10", async () => {
    const container = getContainer();

    const result = await listGuestUsers({
      container,
      headers: createMockHeaders(),
      input: { offset: 0, limit: 10 },
    });

    expect(result.guestUsers).toBeDefined();
    expect(result.totalCount).toBe(0);
  });
});
