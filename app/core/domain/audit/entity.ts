import { BusinessRuleError } from "@/core/domain/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import { AuditErrorCode } from "./errorCode";
import type {
  AuditFilter as AuditFilterType,
  AuditLevel,
  AuditLogId as AuditLogIdType,
  AuditResult,
  ServiceType,
} from "./valueObject";
import { AuditLogId } from "./valueObject";

// ============================================
// AuditLog Entity (Immutable)
// ============================================

type _AuditLog = Readonly<{
  auditLogId: AuditLogIdType;
  level: AuditLevel;
  timestamp: Date;
  sourceIp: string | null;
  userId: UserIdType | null;
  service: ServiceType;
  module: string;
  action: string;
  result: AuditResult;
  errorCode: string | null;
}>;

export type AuditLog = _AuditLog;

export const AuditLog = {
  /**
   * Create a new AuditLog entity.
   * AuditLog is immutable -- once created, it cannot be modified.
   * @throws BusinessRuleError if module is empty (EmptyModule)
   * @throws BusinessRuleError if action is empty (EmptyAction)
   * @throws BusinessRuleError if result is SUCCESS and errorCode is provided (SuccessWithErrorCode)
   */
  create: (params: {
    level: AuditLevel;
    timestamp: Date;
    sourceIp: string | null;
    userId: UserIdType | null;
    service: ServiceType;
    module: string;
    action: string;
    result: AuditResult;
    errorCode: string | null;
  }): _AuditLog => {
    if (params.module.length === 0) {
      throw new BusinessRuleError(
        AuditErrorCode.EmptyModule,
        "Audit log module cannot be empty",
      );
    }

    if (params.action.length === 0) {
      throw new BusinessRuleError(
        AuditErrorCode.EmptyAction,
        "Audit log action cannot be empty",
      );
    }

    if (params.result === "SUCCESS" && params.errorCode !== null) {
      throw new BusinessRuleError(
        AuditErrorCode.SuccessWithErrorCode,
        "Successful audit log must not have an error code",
      );
    }

    return {
      auditLogId: AuditLogId.generate(),
      level: params.level,
      timestamp: params.timestamp,
      sourceIp: params.sourceIp,
      userId: params.userId,
      service: params.service,
      module: params.module,
      action: params.action,
      result: params.result,
      errorCode: params.errorCode,
    };
  },

  /**
   * Reconstruct an AuditLog entity from persisted data.
   */
  reconstruct: (data: _AuditLog): _AuditLog => data,

  /**
   * Check whether this log is within the specified retention period.
   * @param retentionWeeks Retention period in weeks (must be > 0)
   * @returns true if the log timestamp is within retentionWeeks from now
   * @throws BusinessRuleError if retentionWeeks <= 0
   */
  isWithinRetention: (auditLog: _AuditLog, retentionWeeks: number): boolean => {
    if (retentionWeeks <= 0) {
      throw new BusinessRuleError(
        AuditErrorCode.InvalidRetentionPeriod,
        `Retention period must be positive, got ${retentionWeeks}`,
      );
    }

    const retentionLimit = new Date();
    retentionLimit.setDate(retentionLimit.getDate() - retentionWeeks * 7);

    return auditLog.timestamp >= retentionLimit;
  },

  /**
   * Check whether this log matches the specified filter conditions.
   * Only conditions that are non-null are checked.
   * Module and action use partial matching (contains).
   */
  matchesFilter: (auditLog: _AuditLog, filter: AuditFilterType): boolean => {
    if (filter.dateFrom !== null && auditLog.timestamp < filter.dateFrom) {
      return false;
    }

    if (filter.dateTo !== null && auditLog.timestamp > filter.dateTo) {
      return false;
    }

    if (filter.level !== null && auditLog.level !== filter.level) {
      return false;
    }

    if (filter.userId !== null && auditLog.userId !== filter.userId) {
      return false;
    }

    if (filter.service !== null && auditLog.service !== filter.service) {
      return false;
    }

    if (filter.module !== null && !auditLog.module.includes(filter.module)) {
      return false;
    }

    if (filter.action !== null && !auditLog.action.includes(filter.action)) {
      return false;
    }

    if (filter.result !== null && auditLog.result !== filter.result) {
      return false;
    }

    return true;
  },
};

// ============================================
// UserAccessUsage Entity
// ============================================

type _UserAccessUsage = Readonly<{
  userId: UserIdType;
  lastAccessDate: Date | null;
  accessDaysLast30: number;
}>;

export type UserAccessUsage = _UserAccessUsage;

export const UserAccessUsage = {
  /**
   * Create a new UserAccessUsage entity.
   * @throws BusinessRuleError if accessDaysLast30 is not between 0 and 30
   * @throws BusinessRuleError if lastAccessDate is in the future
   */
  create: (params: {
    userId: UserIdType;
    lastAccessDate: Date | null;
    accessDaysLast30: number;
  }): _UserAccessUsage => {
    validateAccessDays(params.accessDaysLast30);
    validateLastAccessDate(params.lastAccessDate);

    return {
      userId: params.userId,
      lastAccessDate: params.lastAccessDate,
      accessDaysLast30: params.accessDaysLast30,
    };
  },

  /**
   * Reconstruct a UserAccessUsage entity from persisted data.
   */
  reconstruct: (data: _UserAccessUsage): _UserAccessUsage => data,

  /**
   * Record a user access event.
   * Updates lastAccessDate if the given accessDate is later than the current value.
   * Note: accessDaysLast30 requires recalculation via recalculateAccessDays.
   * @throws BusinessRuleError if accessDate is in the future
   */
  recordAccess: (
    usage: _UserAccessUsage,
    accessDate: Date,
  ): _UserAccessUsage => {
    validateLastAccessDate(accessDate);

    const newLastAccessDate =
      usage.lastAccessDate === null || accessDate > usage.lastAccessDate
        ? accessDate
        : usage.lastAccessDate;

    return {
      ...usage,
      lastAccessDate: newLastAccessDate,
    };
  },

  /**
   * Recalculate the number of access days in the last 30 days.
   * @param accessDates List of access dates within the last 30 days
   */
  recalculateAccessDays: (
    usage: _UserAccessUsage,
    accessDates: readonly Date[],
  ): _UserAccessUsage => {
    const uniqueDays = new Set(accessDates.map((d) => toDateString(d)));
    const accessDaysLast30 = uniqueDays.size;

    validateAccessDays(accessDaysLast30);

    return {
      ...usage,
      accessDaysLast30,
    };
  },
};

// ============================================
// AuditLogSetting Entity (Singleton)
// ============================================

type _AuditLogSetting = Readonly<{
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}>;

export type AuditLogSetting = _AuditLogSetting;

export const AuditLogSetting = {
  /**
   * Create a new AuditLogSetting entity.
   * @throws BusinessRuleError if createdAt > updatedAt
   */
  create: (params: {
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }): _AuditLogSetting => {
    validateTimestamps(params.createdAt, params.updatedAt);

    return {
      settings: params.settings,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    };
  },

  /**
   * Reconstruct an AuditLogSetting entity from persisted data.
   */
  reconstruct: (data: _AuditLogSetting): _AuditLogSetting => data,

  /**
   * Update the audit log settings.
   * Replaces settings with the new values and sets updatedAt to the current time.
   */
  updateSettings: (
    setting: _AuditLogSetting,
    newSettings: Record<string, unknown>,
  ): _AuditLogSetting => {
    return {
      ...setting,
      settings: newSettings,
      updatedAt: new Date(),
    };
  },
};

// ============================================
// Private Helpers
// ============================================

function validateAccessDays(accessDays: number): void {
  if (accessDays < 0 || accessDays > 30) {
    throw new BusinessRuleError(
      AuditErrorCode.InvalidAccessDays,
      `Access days must be between 0 and 30, got ${accessDays}`,
    );
  }
}

function validateLastAccessDate(date: Date | null): void {
  if (date !== null && date > new Date()) {
    throw new BusinessRuleError(
      AuditErrorCode.FutureAccessDate,
      "Last access date must not be in the future",
    );
  }
}

function validateTimestamps(createdAt: Date, updatedAt: Date): void {
  if (createdAt > updatedAt) {
    throw new BusinessRuleError(
      AuditErrorCode.InvalidTimestamps,
      "createdAt must be less than or equal to updatedAt",
    );
  }
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
