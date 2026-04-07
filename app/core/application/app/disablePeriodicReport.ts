import { Report } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import { AppId, AppStatus, ReportId } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { DisablePeriodicReportOutput } from "./dto";

export type DisablePeriodicReportInput = {
  appId: string;
  reportId: string;
  executorId: string;
};

export async function disablePeriodicReport({
  container,
  input,
}: ServiceArgs<DisablePeriodicReportInput>): Promise<DisablePeriodicReportOutput> {
  const appId = AppId.create(input.appId);
  const reportId = ReportId.create(input.reportId);
  const _executorId = UserId.create(input.executorId);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const app = await repos.appRepository.findById(appId);
    if (app === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.appId} not found`,
      );
    }
    if (AppStatus.isDeleted(app.status)) {
      throw new BusinessRuleError(
        AppErrorCode.DeletedAppModification,
        "Cannot modify a deleted app",
      );
    }

    const existingReport = await repos.reportRepository.findById(reportId);
    if (existingReport === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Report ${input.reportId} not found`,
      );
    }

    const { entity: report } = Report.disablePeriodicReport(existingReport);

    await repos.reportRepository.save(report);

    return {
      reportId: report.reportId,
      isSettingsLocked: Report.isSettingsLocked(report),
    };
  });
}
