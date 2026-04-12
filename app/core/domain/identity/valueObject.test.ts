import { describe, expect, it } from "vitest";
import { IdentityErrorCode } from "@/core/domain/identity/errorCode";
import {
  LockoutPolicy,
  PasswordPolicy,
} from "@/core/domain/identity/valueObject";

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

  it("should throw InvalidLockoutDuration (not InconsistentLockoutPolicy) when maxFailedAttempts is null and lockoutDuration is 0", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: null,
        lockoutDuration: 0,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutDuration,
      }),
    );
  });

  // --- 異常系: lockoutDuration 非整数 ---

  it("should throw BusinessRuleError when lockoutDuration is a non-integer float (3.7)", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: 5,
        lockoutDuration: 3.7,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutDuration,
      }),
    );
  });

  it("should throw BusinessRuleError when lockoutDuration is a positive non-integer float (0.5)", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: 5,
        lockoutDuration: 0.5,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutDuration,
      }),
    );
  });

  it("should throw InvalidLockoutDuration (not InconsistentLockoutPolicy) when maxFailedAttempts is null and lockoutDuration is a non-integer float (3.7)", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: null,
        lockoutDuration: 3.7,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutDuration,
      }),
    );
  });

  it("should throw BusinessRuleError when lockoutDuration is NaN", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: 5,
        lockoutDuration: Number.NaN,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutDuration,
      }),
    );
  });

  it("should throw BusinessRuleError when lockoutDuration is Infinity", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: 5,
        lockoutDuration: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutDuration,
      }),
    );
  });
});

describe("PasswordPolicy.create", () => {
  const validParams = {
    minLength: 8,
    complexity: "alphanumeric" as const,
    allowSameAsLoginName: false,
    expirationDays: null as number | null,
    historyCount: 3,
    allowUserChange: true,
    allowUserReset: true,
  };

  // --- 正常系 ---

  it("should accept expirationDays: null (no expiration)", () => {
    const policy = PasswordPolicy.create({
      ...validParams,
      expirationDays: null,
    });

    expect(policy.expirationDays).toBeNull();
  });

  it("should accept expirationDays: 30 (positive integer)", () => {
    const policy = PasswordPolicy.create({
      ...validParams,
      expirationDays: 30,
    });

    expect(policy.expirationDays).toBe(30);
  });

  it("should accept expirationDays: 1 (minimum positive integer boundary)", () => {
    const policy = PasswordPolicy.create({
      ...validParams,
      expirationDays: 1,
    });

    expect(policy.expirationDays).toBe(1);
  });

  // --- 異常系: expirationDays 非正値 ---

  it("should throw BusinessRuleError when expirationDays is 0", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        expirationDays: 0,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordExpirationDays,
      }),
    );
  });

  it("should throw BusinessRuleError when expirationDays is negative", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        expirationDays: -1,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordExpirationDays,
      }),
    );
  });

  // --- 異常系: expirationDays 非整数 ---

  it("should throw BusinessRuleError when expirationDays is a non-integer float (3.7)", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        expirationDays: 3.7,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordExpirationDays,
      }),
    );
  });

  it("should throw BusinessRuleError when expirationDays is a positive non-integer float (0.5)", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        expirationDays: 0.5,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordExpirationDays,
      }),
    );
  });

  it("should throw BusinessRuleError when expirationDays is NaN", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        expirationDays: Number.NaN,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordExpirationDays,
      }),
    );
  });

  it("should throw BusinessRuleError when expirationDays is Infinity", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        expirationDays: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordExpirationDays,
      }),
    );
  });
});
