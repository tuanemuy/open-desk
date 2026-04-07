import { Report } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type {
  ChartSubType,
  ChartType,
  ReportAggregation,
  ReportGroup,
  ReportSortSpec,
} from "@/core/domain/app/valueObject";
import { AppId, AppStatus } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { CreateReportOutput } from "./dto";

export type CreateReportInput = {
  appId: string;
  reportName: string;
  chartType: ChartType;
  chartSubType: ChartSubType | null;
  groups: ReportGroup[];
  aggregations: ReportAggregation[];
  filterCondition: string | null;
  sort: ReportSortSpec[] | null;
  creatorId: string;
};

export async function createReport({
  container,
  input,
}: ServiceArgs<CreateReportInput>): Promise<CreateReportOutput> {
  const appId = AppId.create(input.appId);
  const _creatorId = UserId.create(input.creatorId);

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

    const { entity: report } = Report.create({
      appId,
      reportName: input.reportName,
      chartType: input.chartType,
      chartSubType: input.chartSubType,
      groups: input.groups,
      aggregations: input.aggregations,
      filterCondition: input.filterCondition,
      sort: input.sort ?? undefined,
    });

    await repos.reportRepository.save(report);

    return {
      reportId: report.reportId,
      reportName: report.reportName,
      chartType: report.chartType,
    };
  });
}
