import { Report } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type {
  ChartSubType,
  ChartType,
  ReportAggregation,
  ReportGroup,
  ReportSortSpec,
} from "@/core/domain/app/valueObject";
import { AppId, AppStatus, ReportId } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { UpdateReportOutput } from "./dto";

export type UpdateReportInput = {
  appId: string;
  reportId: string;
  reportName: string | null;
  chartType: ChartType | null;
  chartSubType: ChartSubType | null;
  groups: ReportGroup[] | null;
  aggregations: ReportAggregation[] | null;
  filterCondition: string | null | undefined;
  sort: ReportSortSpec[] | null;
  modifierId: string;
};

export async function updateReport({
  container,
  input,
}: ServiceArgs<UpdateReportInput>): Promise<UpdateReportOutput> {
  const appId = AppId.create(input.appId);
  const reportId = ReportId.create(input.reportId);
  const _modifierId = UserId.create(input.modifierId);

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

    let report = existingReport;

    if (input.reportName !== null) {
      const result = Report.rename(report, input.reportName);
      report = result.entity;
    }

    if (input.chartType !== null) {
      const result = Report.setChartType(
        report,
        input.chartType,
        input.chartSubType ?? report.chartSubType,
      );
      report = result.entity;
    }

    if (input.groups !== null) {
      const result = Report.setGroups(report, input.groups);
      report = result.entity;
    }

    if (input.aggregations !== null) {
      const result = Report.setAggregations(report, input.aggregations);
      report = result.entity;
    }

    if (input.filterCondition !== undefined) {
      const result = Report.setFilter(report, input.filterCondition ?? null);
      report = result.entity;
    }

    if (input.sort !== null) {
      const result = Report.setSort(report, input.sort);
      report = result.entity;
    }

    await repos.reportRepository.save(report);

    return {
      reportId: report.reportId,
      reportName: report.reportName,
      chartType: report.chartType,
      updatedAt: new Date(),
    };
  });
}
