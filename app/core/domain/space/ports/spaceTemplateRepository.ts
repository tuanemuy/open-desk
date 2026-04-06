import type { SpaceTemplate } from "@/core/domain/space/entity";
import type { SpaceTemplateId } from "@/core/domain/space/valueObject";

export interface SpaceTemplateRepository {
  findById(templateId: SpaceTemplateId): Promise<SpaceTemplate | null>;
  list(
    offset: number,
    limit: number,
  ): Promise<{ templates: SpaceTemplate[]; totalCount: number }>;
  save(template: SpaceTemplate): Promise<void>;
  delete(templateId: SpaceTemplateId): Promise<void>;
}
