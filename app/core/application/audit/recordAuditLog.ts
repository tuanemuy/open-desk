import { ValidationError, ValidationErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { AuditLog } from "@/core/domain/audit/entity";
import type {
  AuditLevel,
  AuditResult,
  ServiceType,
} from "@/core/domain/audit/valueObject";
import type { RecordAuditLogOutput } from "./dto";

export type RecordAuditLogInput = {
  level: AuditLevel;
  timestamp: Date;
  sourceIp: string | null;
  userId: string | null;
  service: ServiceType;
  module: string;
  action: string;
  result: AuditResult;
  errorCode: string | null;
};

export async function recordAuditLog({
  container,
  input,
}: ServiceArgs<RecordAuditLogInput>): Promise<RecordAuditLogOutput> {
  if (input.module.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Audit log module is required",
    );
  }

  if (input.action.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Audit log action is required",
    );
  }

  const correctedErrorCode =
    input.result === "SUCCESS" ? null : input.errorCode;

  const auditLog = AuditLog.create({
    level: input.level,
    timestamp: input.timestamp,
    sourceIp: input.sourceIp,
    userId: input.userId as Parameters<typeof AuditLog.create>[0]["userId"],
    service: input.service,
    module: input.module,
    action: input.action,
    result: input.result,
    errorCode: correctedErrorCode,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.auditLogRepository.save(auditLog);
  });

  return {
    auditLogId: auditLog.auditLogId,
  };
}
