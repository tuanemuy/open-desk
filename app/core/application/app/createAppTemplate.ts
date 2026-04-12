import { AppTemplate } from "@/core/domain/app/entity";
import { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { AppTemplateDto } from "./dto";

export type CreateAppTemplateInput = {
  readonly operatorId: string;
  readonly sourceAppId: string;
  readonly name: string;
  readonly description?: string | null;
};

export async function createAppTemplate({
  container,
  input,
}: ServiceArgs<CreateAppTemplateInput>): Promise<AppTemplateDto> {
  const operatorId = input.operatorId as UserId;
  const sourceAppId = AppId.create(input.sourceAppId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const app = await ctx.appRepository.findById(sourceAppId);
    if (!app) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.sourceAppId} not found`,
      );
    }

    if (app.status === "DELETED") {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Cannot create template from deleted app",
      );
    }

    const template = AppTemplate.create({
      name: input.name,
      description: input.description ?? null,
      sourceAppId,
      creatorId: operatorId,
    });

    await ctx.appTemplateRepository.save(template);

    return {
      templateId: template.templateId,
      name: template.name,
      description: template.description,
      sourceAppId: template.sourceAppId,
      creatorId: template.creatorId,
      createdAt: template.createdAt,
    };
  });
}
