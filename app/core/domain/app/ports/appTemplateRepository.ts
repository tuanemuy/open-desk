import type { UserId } from "@/core/domain/identity/valueObject";
import type { AppTemplate } from "../entity";
import type { AppTemplateId, AppTemplateName } from "../valueObject";

export interface AppTemplateRepository {
  findById(templateId: AppTemplateId): Promise<AppTemplate | null>;
  list(
    offset: number,
    limit: number,
  ): Promise<{ templates: AppTemplate[]; totalCount: number }>;
  save(template: AppTemplate): Promise<void>;
  delete(templateId: AppTemplateId): Promise<void>;
  exportToFile(templateId: AppTemplateId): Promise<ArrayBuffer>;
  importFromFile(
    file: ArrayBuffer,
    name: AppTemplateName,
    creatorId: UserId,
  ): Promise<AppTemplate>;
}
