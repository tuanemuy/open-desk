import { ValidationError, ValidationErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import type { DeleteExpiredAuditLogsOutput } from "./dto";

export type DeleteExpiredAuditLogsInput = {
  retentionWeeks: number;
};

export async function deleteExpiredAuditLogs({
  container,
  input,
}: ServiceArgs<DeleteExpiredAuditLogsInput>): Promise<DeleteExpiredAuditLogsOutput> {
  if (input.retentionWeeks < 1) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Retention period must be at least 1 week",
    );
  }

  const deletedCount = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.auditLogRepository.deleteExpired(input.retentionWeeks);
    },
  );

  return {
    deletedCount,
  };
}
