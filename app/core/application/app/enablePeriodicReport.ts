import { Report } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type { PeriodicInterval as PeriodicIntervalType } from "@/core/domain/app/valueObject";
import {
  AppId,
  AppStatus,
  PeriodicReportConfig,
  ReportId,
} from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { EnablePeriodicReportOutput } from "./dto";

export type EnablePeriodicReportInput = {
  appId: string;
  reportId: string;
  interval: PeriodicIntervalType;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  quarterMonth: number | null;
  hourMinute: { hour: number; minute: number } | null;
  minuteOfHour: number | null;
  timezone: string;
  executorId: string;
};

export async function enablePeriodicReport({
  container,
  input,
}: ServiceArgs<EnablePeriodicReportInput>): Promise<EnablePeriodicReportOutput> {
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

    if (existingReport.periodicReport !== null) {
      throw new BusinessRuleError(
        AppErrorCode.PeriodicReportAlreadyRunning,
        "Periodic report is already enabled",
      );
    }

    const config = PeriodicReportConfig.create({
      interval: input.interval,
      dayOfMonth: input.dayOfMonth,
      dayOfWeek: input.dayOfWeek,
      quarterMonth: input.quarterMonth,
      hourMinute: input.hourMinute,
      minuteOfHour: input.minuteOfHour,
      timezone: input.timezone,
      isRunning: true,
    });

    const { entity: report } = Report.enablePeriodicReport(
      existingReport,
      config,
    );

    await repos.reportRepository.save(report);

    return {
      reportId: report.reportId,
      isSettingsLocked: Report.isSettingsLocked(report),
      periodicReport: config,
    };
  });
}
