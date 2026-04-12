import { describe, expect, it } from "vitest";
import { IdentityErrorCode } from "@/core/domain/identity/errorCode";
import {
  LockoutPolicy,
  PasswordPolicy,
  SessionPolicy,
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

  // --- 異常系: maxFailedAttempts 非整数 ---

  it("should throw BusinessRuleError when maxFailedAttempts is a non-integer float (5.5)", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: 5.5,
        lockoutDuration: null,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutMaxAttempts,
      }),
    );
  });

  it("should throw BusinessRuleError when maxFailedAttempts is NaN", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: Number.NaN,
        lockoutDuration: null,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidLockoutMaxAttempts,
      }),
    );
  });

  it("should throw BusinessRuleError when maxFailedAttempts is Infinity", () => {
    expect(() =>
      LockoutPolicy.create({
        maxFailedAttempts: Number.POSITIVE_INFINITY,
        lockoutDuration: null,
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

  // --- 正常系 / 境界値: minLength ---

  it("should accept minLength at minimum boundary (3)", () => {
    const policy = PasswordPolicy.create({ ...validParams, minLength: 3 });
    expect(policy.minLength).toBe(3);
  });

  it("should accept minLength at maximum boundary (15)", () => {
    const policy = PasswordPolicy.create({ ...validParams, minLength: 15 });
    expect(policy.minLength).toBe(15);
  });

  // --- 正常系 / 境界値: historyCount ---

  it("should accept historyCount at minimum boundary (0)", () => {
    const policy = PasswordPolicy.create({ ...validParams, historyCount: 0 });
    expect(policy.historyCount).toBe(0);
  });

  it("should accept historyCount at maximum boundary (15)", () => {
    const policy = PasswordPolicy.create({ ...validParams, historyCount: 15 });
    expect(policy.historyCount).toBe(15);
  });

  // --- 異常系: minLength 範囲外 ---

  it("should throw BusinessRuleError when minLength is below minimum (2)", () => {
    expect(() =>
      PasswordPolicy.create({ ...validParams, minLength: 2 }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordMinLength,
      }),
    );
  });

  it("should throw BusinessRuleError when minLength exceeds maximum (16)", () => {
    expect(() =>
      PasswordPolicy.create({ ...validParams, minLength: 16 }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordMinLength,
      }),
    );
  });

  // --- 異常系: historyCount 範囲外 ---

  it("should throw BusinessRuleError when historyCount is below minimum (-1)", () => {
    expect(() =>
      PasswordPolicy.create({ ...validParams, historyCount: -1 }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordHistoryCount,
      }),
    );
  });

  it("should throw BusinessRuleError when historyCount exceeds maximum (16)", () => {
    expect(() =>
      PasswordPolicy.create({ ...validParams, historyCount: 16 }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordHistoryCount,
      }),
    );
  });

  // --- 異常系: minLength 非整数 ---

  it("should throw BusinessRuleError when minLength is a non-integer float (8.5)", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        minLength: 8.5,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordMinLength,
      }),
    );
  });

  it("should throw BusinessRuleError when minLength is NaN", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        minLength: Number.NaN,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordMinLength,
      }),
    );
  });

  it("should throw BusinessRuleError when minLength is Infinity", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        minLength: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordMinLength,
      }),
    );
  });

  // --- 異常系: historyCount 非整数 ---

  it("should throw BusinessRuleError when historyCount is a non-integer float (3.7)", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        historyCount: 3.7,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordHistoryCount,
      }),
    );
  });

  it("should throw BusinessRuleError when historyCount is NaN", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        historyCount: Number.NaN,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordHistoryCount,
      }),
    );
  });

  it("should throw BusinessRuleError when historyCount is Infinity", () => {
    expect(() =>
      PasswordPolicy.create({
        ...validParams,
        historyCount: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidPasswordHistoryCount,
      }),
    );
  });
});

describe("SessionPolicy.create", () => {
  // --- 正常系 ---

  it("should accept timeoutMinutes: 30 (valid integer)", () => {
    const policy = SessionPolicy.create(30);
    expect(policy.timeoutMinutes).toBe(30);
  });

  // --- 境界値 ---

  it("should accept timeoutMinutes at minimum boundary (15)", () => {
    const policy = SessionPolicy.create(15);
    expect(policy.timeoutMinutes).toBe(15);
  });

  it("should accept timeoutMinutes at maximum boundary (1440)", () => {
    const policy = SessionPolicy.create(1440);
    expect(policy.timeoutMinutes).toBe(1440);
  });

  // --- 異常系: 範囲外 ---

  it("should throw BusinessRuleError when timeoutMinutes is below minimum (14)", () => {
    expect(() => SessionPolicy.create(14)).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidSessionTimeout,
      }),
    );
  });

  it("should throw BusinessRuleError when timeoutMinutes exceeds maximum (1441)", () => {
    expect(() => SessionPolicy.create(1441)).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidSessionTimeout,
      }),
    );
  });

  // --- 異常系: 非整数 ---

  it("should throw BusinessRuleError when timeoutMinutes is a non-integer float (30.5)", () => {
    expect(() => SessionPolicy.create(30.5)).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidSessionTimeout,
      }),
    );
  });

  it("should throw BusinessRuleError when timeoutMinutes is NaN", () => {
    expect(() => SessionPolicy.create(Number.NaN)).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidSessionTimeout,
      }),
    );
  });

  it("should throw BusinessRuleError when timeoutMinutes is Infinity", () => {
    expect(() => SessionPolicy.create(Number.POSITIVE_INFINITY)).toThrow(
      expect.objectContaining({
        name: "BusinessRuleError",
        code: IdentityErrorCode.InvalidSessionTimeout,
      }),
    );
  });
});
