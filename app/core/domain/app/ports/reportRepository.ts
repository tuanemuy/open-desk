import type { Report } from "../entity";
import type { AppId, ReportId } from "../valueObject";

export interface ReportRepository {
  findById(reportId: ReportId): Promise<Report | null>;
  findByAppId(appId: AppId): Promise<readonly Report[]>;
  save(report: Report): Promise<void>;
  delete(reportId: ReportId): Promise<void>;
}
