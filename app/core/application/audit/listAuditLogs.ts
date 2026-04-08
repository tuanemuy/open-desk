import { ValidationError, ValidationErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import type {
  AuditLevel,
  AuditResult,
  ServiceType,
} from "@/core/domain/audit/valueObject";
import { AuditFilter } from "@/core/domain/audit/valueObject";
import type { AuditLogListOutput } from "./dto";

const RETENTION_WEEKS = 6;

export type ListAuditLogsInput = {
  filter: {
    dateFrom: Date | null;
    dateTo: Date | null;
    level: AuditLevel | null;
    userId: string | null;
    service: ServiceType | null;
    module: string | null;
    action: string | null;
    result: AuditResult | null;
  };
  limit: number;
  offset: number;
};

export async function listAuditLogs({
  container,
  input,
}: ServiceArgs<ListAuditLogsInput>): Promise<AuditLogListOutput> {
  if (input.limit < 1) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Limit must be at least 1",
    );
  }

  if (input.offset < 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Offset must be 0 or greater",
    );
  }

  const dateFrom = input.filter.dateFrom ?? getRetentionLimitDate();

  const filter = AuditFilter.create({
    dateFrom,
    dateTo: input.filter.dateTo,
    level: input.filter.level,
    userId: input.filter.userId as Parameters<
      typeof AuditFilter.create
    >[0]["userId"],
    service: input.filter.service,
    module: input.filter.module,
    action: input.filter.action,
    result: input.filter.result,
  });

  const { logs, totalCount } = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.auditLogRepository.findByFilter(
        filter,
        input.limit,
        input.offset,
      );
    },
  );

  return {
    logs: logs.map((log) => ({
      auditLogId: log.auditLogId,
      level: log.level,
      timestamp: log.timestamp,
      sourceIp: log.sourceIp,
      userId: log.userId,
      service: log.service,
      module: log.module,
      action: log.action,
      result: log.result,
      errorCode: log.errorCode,
    })),
    totalCount,
  };
}

function getRetentionLimitDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() - RETENTION_WEEKS * 7);
  return date;
}
