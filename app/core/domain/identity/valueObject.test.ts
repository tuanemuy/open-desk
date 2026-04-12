import { describe, expect, it } from "vitest";
import { BusinessRuleError } from "@/core/domain/error";
import { IdentityErrorCode } from "@/core/domain/identity/errorCode";
import { LockoutPolicy } from "@/core/domain/identity/valueObject";

describe("LockoutPolicy.create", () => {
  it("should accept maxFailedAttempts: null and lockoutDuration: null (lockout disabled)", () => {
    const policy = LockoutPolicy.create({
      maxFailedAttempts: null,
      lockoutDuration: null,
    });

    expect(policy.maxFailedAttempts).toBeNull();
    expect(policy.lockoutDuration).toBeNull();
  });

  it("should accept maxFailedAttempts: 5 and lockoutDuration: 30", () => {
    const policy = LockoutPolicy.create({
      maxFailedAttempts: 5,
      lockoutDuration: 30,
    });

    expect(policy.maxFailedAttempts).toBe(5);
    expect(policy.lockoutDuration).toBe(30);
  });

  it("should accept maxFailedAttempts: 5 and lockoutDuration: null (permanent lock)", () => {
    const policy = LockoutPolicy.create({
      maxFailedAttempts: 5,
      lockoutDuration: null,
    });

    expect(policy.maxFailedAttempts).toBe(5);
    expect(policy.lockoutDuration).toBeNull();
  });

  it("should throw BusinessRuleError when maxFailedAttempts is null but lockoutDuration is non-null", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: null,
        lockoutDuration: 30,
      }),
    ).toThrow(BusinessRuleError);

    try {
      LockoutPolicy.create({
        maxFailedAttempts: null,
        lockoutDuration: 30,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(BusinessRuleError);
      expect((error as BusinessRuleError).code).toBe(
        IdentityErrorCode.InconsistentLockoutPolicy,
      );
    }
  });
});
