import type {
  AuditLevel,
  AuditLogId,
  AuditResult,
  ServiceType,
} from "@/core/domain/audit/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";

export type AuditLogOutput = {
  auditLogId: AuditLogId;
  level: AuditLevel;
  timestamp: Date;
  sourceIp: string | null;
  userId: UserId | null;
  service: ServiceType;
  module: string;
  action: string;
  result: AuditResult;
  errorCode: string | null;
};

export type AuditLogListOutput = {
  logs: AuditLogOutput[];
  totalCount: number;
};

export type RecordAuditLogOutput = {
  auditLogId: AuditLogId;
};

export type DeleteExpiredAuditLogsOutput = {
  deletedCount: number;
};

export type UserAccessUsageOutput = {
  userId: UserId;
  lastAccessDate: Date | null;
  accessDaysLast30: number;
};

export type UserAccessUsageListOutput = {
  usages: UserAccessUsageOutput[];
};

export type AuditLogSettingOutput = {
  setting: {
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
};
