import type { ServiceArgs } from "@/core/application/types";
import { AuditErrorCode } from "@/core/domain/audit/errorCode";
import type {
  AuditLevel,
  AuditResult,
  ServiceType,
} from "@/core/domain/audit/valueObject";
import { AuditFilter } from "@/core/domain/audit/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import type { AuditLogListOutput } from "./dto";

const RETENTION_WEEKS = 6;
const EXPORT_LIMIT = 100_000;

export type ExportAuditLogsCsvInput = {
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
};

export async function exportAuditLogsCsv({
  container,
  input,
}: ServiceArgs<ExportAuditLogsCsvInput>): Promise<AuditLogListOutput> {
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

  const logs = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.auditLogRepository.findForExport(filter);
  });

  if (logs.length > EXPORT_LIMIT) {
    throw new BusinessRuleError(
      AuditErrorCode.ExportLimitExceeded,
      `Export limit exceeded: ${logs.length} records found, maximum is ${EXPORT_LIMIT}`,
    );
  }

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
    totalCount: logs.length,
  };
}

function getRetentionLimitDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() - RETENTION_WEEKS * 7 + 1);
  return date;
}
