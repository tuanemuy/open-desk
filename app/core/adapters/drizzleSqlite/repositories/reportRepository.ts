import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { reports } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Report } from "@/core/domain/app/entity";
import type { ReportRepository } from "@/core/domain/app/ports/reportRepository";
import type {
  AppId as AppIdType,
  ChartSubType as ChartSubTypeType,
  ChartType as ChartTypeType,
  PeriodicReportConfig as PeriodicReportConfigType,
  ReportAggregation as ReportAggregationType,
  ReportGroup as ReportGroupType,
  ReportId as ReportIdType,
  ReportSortSpec as ReportSortSpecType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type ReportDataModel = InferSelectModel<typeof reports>;

export class DrizzleSqliteReportRepository implements ReportRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: ReportDataModel): Report {
    return {
      reportId: data.id as ReportIdType,
      appId: data.appId as AppIdType,
      reportName: data.reportName,
      chartType: data.chartType as ChartTypeType,
      chartSubType:
        data.chartSubType !== null
          ? (data.chartSubType as ChartSubTypeType)
          : null,
      groups: data.groups as unknown as readonly ReportGroupType[],
      aggregations:
        data.aggregations as unknown as readonly ReportAggregationType[],
      filterCondition: data.filterCondition,
      sort: data.sort as unknown as readonly ReportSortSpecType[],
      periodicReport:
        data.periodicReportConfig !== null
          ? (data.periodicReportConfig as unknown as PeriodicReportConfigType)
          : null,
    };
  }

  async findById(reportId: ReportIdType): Promise<Report | null> {
    try {
      const results = await this.executor
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find report by id",
        error,
      );
    }
  }

  async findByAppId(appId: AppIdType): Promise<readonly Report[]> {
    try {
      const results = await this.executor
        .select()
        .from(reports)
        .where(eq(reports.appId, appId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find reports by app id",
        error,
      );
    }
  }

  async save(report: Report): Promise<void> {
    try {
      await this.executor
        .insert(reports)
        .values({
          id: report.reportId,
          appId: report.appId,
          reportName: report.reportName,
          chartType: report.chartType,
          chartSubType: report.chartSubType,
          groups: report.groups as unknown as Record<string, unknown>[],
          aggregations: report.aggregations as unknown as Record<
            string,
            unknown
          >[],
          filterCondition: report.filterCondition,
          sort: report.sort as unknown as Record<string, unknown>[],
          periodicReportConfig:
            report.periodicReport !== null
              ? (report.periodicReport as unknown as Record<string, unknown>)
              : null,
        })
        .onConflictDoUpdate({
          target: reports.id,
          set: {
            appId: report.appId,
            reportName: report.reportName,
            chartType: report.chartType,
            chartSubType: report.chartSubType,
            groups: report.groups as unknown as Record<string, unknown>[],
            aggregations: report.aggregations as unknown as Record<
              string,
              unknown
            >[],
            filterCondition: report.filterCondition,
            sort: report.sort as unknown as Record<string, unknown>[],
            periodicReportConfig:
              report.periodicReport !== null
                ? (report.periodicReport as unknown as Record<string, unknown>)
                : null,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save report",
        error,
      );
    }
  }

  async delete(reportId: ReportIdType): Promise<void> {
    try {
      await this.executor.delete(reports).where(eq(reports.id, reportId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete report",
        error,
      );
    }
  }
}
