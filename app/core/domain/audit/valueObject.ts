import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import { AuditErrorCode } from "./errorCode";

// ============================================
// AuditLogId
// ============================================

type _AuditLogId = string & { readonly brand: "AuditLogId" };

export type AuditLogId = _AuditLogId;

export const AuditLogId = {
  create: (id: string): _AuditLogId => {
    return id as _AuditLogId;
  },
  generate: (): _AuditLogId => {
    return uuidv7() as _AuditLogId;
  },
};

// ============================================
// AuditLevel
// ============================================

export type AuditLevel = "CRITICAL" | "INFO";

// ============================================
// AuditResult
// ============================================

export type AuditResult = "SUCCESS" | "FAILURE";

// ============================================
// ServiceType
// ============================================

export type ServiceType = "COMMON" | "OPEN_DESK" | "GAROON" | "CYBOZU_OFFICE";

// ============================================
// AuditFilter
// ============================================

type _AuditFilter = Readonly<{
  dateFrom: Date | null;
  dateTo: Date | null;
  level: AuditLevel | null;
  userId: UserIdType | null;
  service: ServiceType | null;
  module: string | null;
  action: string | null;
  result: AuditResult | null;
}>;

export type AuditFilter = _AuditFilter;

const RETENTION_WEEKS = 6;

export const AuditFilter = {
  /**
   * Create a new AuditFilter value object.
   * @throws BusinessRuleError if dateFrom > dateTo
   * @throws BusinessRuleError if dateFrom is older than the retention period (6 weeks)
   */
  create: (params: {
    dateFrom: Date | null;
    dateTo: Date | null;
    level: AuditLevel | null;
    userId: UserIdType | null;
    service: ServiceType | null;
    module: string | null;
    action: string | null;
    result: AuditResult | null;
  }): _AuditFilter => {
    if (
      params.dateFrom !== null &&
      params.dateTo !== null &&
      params.dateFrom > params.dateTo
    ) {
      throw new BusinessRuleError(
        AuditErrorCode.InvalidAuditFilter,
        "dateFrom must be less than or equal to dateTo",
      );
    }

    if (params.dateFrom !== null) {
      const retentionLimit = new Date();
      retentionLimit.setDate(retentionLimit.getDate() - RETENTION_WEEKS * 7);
      if (params.dateFrom < retentionLimit) {
        throw new BusinessRuleError(
          AuditErrorCode.InvalidAuditFilter,
          `dateFrom cannot be older than ${RETENTION_WEEKS} weeks`,
        );
      }
    }

    return {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      level: params.level,
      userId: params.userId,
      service: params.service,
      module: params.module,
      action: params.action,
      result: params.result,
    };
  },

  /**
   * Create an empty filter with no conditions.
   */
  empty: (): _AuditFilter => ({
    dateFrom: null,
    dateTo: null,
    level: null,
    userId: null,
    service: null,
    module: null,
    action: null,
    result: null,
  }),

  /**
   * Check equality of two AuditFilter instances.
   */
  equals: (a: _AuditFilter, b: _AuditFilter): boolean => {
    return (
      a.dateFrom?.getTime() === b.dateFrom?.getTime() &&
      a.dateTo?.getTime() === b.dateTo?.getTime() &&
      a.level === b.level &&
      a.userId === b.userId &&
      a.service === b.service &&
      a.module === b.module &&
      a.action === b.action &&
      a.result === b.result
    );
  },
};
