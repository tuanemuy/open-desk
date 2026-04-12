import { describe, expect, it } from "vitest";
import { IdentityErrorCode } from "@/core/domain/identity/errorCode";
import { LockoutPolicy } from "@/core/domain/identity/valueObject";

describe("LockoutPolicy.create", () => {
  // --- 正常系 ---

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

  // --- 境界値 ---

  it("should accept maxFailedAttempts at minimum boundary (3)", () => {
    const policy = LockoutPolicy.create({
      maxFailedAttempts: 3,
      lockoutDuration: 1,
    });

    expect(policy.maxFailedAttempts).toBe(3);
    expect(policy.lockoutDuration).toBe(1);
  });

  it("should accept maxFailedAttempts at maximum boundary (10)", () => {
    const policy = LockoutPolicy.create({
      maxFailedAttempts: 10,
      lockoutDuration: 1,
    });

    expect(policy.maxFailedAttempts).toBe(10);
    expect(policy.lockoutDuration).toBe(1);
  });

  // --- 異常系: 矛盾チェック ---

  it("should throw BusinessRuleError with InconsistentLockoutPolicy when maxFailedAttempts is null but lockoutDuration is non-null", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: null,
        lockoutDuration: 30,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InconsistentLockoutPolicy,
      }),
    );
  });

  it("should throw BusinessRuleError with InconsistentLockoutPolicy when lockoutDuration is 1 and maxFailedAttempts is null", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: null,
        lockoutDuration: 1,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InconsistentLockoutPolicy,
      }),
    );
  });

  // --- 異常系: maxFailedAttempts 範囲外 ---

  it("should throw BusinessRuleError when maxFailedAttempts is below minimum (2)", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: 2,
        lockoutDuration: 30,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutMaxAttempts,
      }),
    );
  });

  it("should throw BusinessRuleError when maxFailedAttempts exceeds maximum (11)", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: 11,
        lockoutDuration: 30,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutMaxAttempts,
      }),
    );
  });

  // --- 異常系: lockoutDuration 非正値 ---

  it("should throw BusinessRuleError when lockoutDuration is 0", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: 5,
        lockoutDuration: 0,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutDuration,
      }),
    );
  });

  it("should throw BusinessRuleError when lockoutDuration is negative", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: 5,
        lockoutDuration: -1,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutDuration,
      }),
    );
  });

  // --- 異常系: 矛盾チェックと既存バリデーションの相互作用 ---

  it("should throw InvalidLockoutDuration (not InconsistentLockoutPolicy) when maxFailedAttempts is null and lockoutDuration is negative", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: null,
        lockoutDuration: -5,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutDuration,
      }),
    );
  });
});
