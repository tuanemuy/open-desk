import { AppErrorCode } from "@/core/domain/app/errorCode";
import type { SpaceId } from "@/core/domain/app/valueObject";
import { AppId } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { SpaceId as SpaceDomainSpaceId } from "@/core/domain/space/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { CreateAppOutput } from "./dto";

const MAX_APP_COUNT = 1000;

export type CreateAppFromExistingInput = {
  sourceAppId: string;
  name: string;
  spaceId: string | null;
  creatorId: string;
};

export async function createAppFromExisting({
  container,
  input,
}: ServiceArgs<CreateAppFromExistingInput>): Promise<CreateAppOutput> {
  const _creatorId = UserId.create(input.creatorId);
  const spaceId: SpaceId | null = input.spaceId
    ? (input.spaceId as unknown as SpaceId)
    : null;
  const sourceAppId = AppId.create(input.sourceAppId);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const appCount = await repos.appRepository.countAll();
    if (appCount >= MAX_APP_COUNT) {
      throw new BusinessRuleError(
        AppErrorCode.DeletedAppModification,
        `Cannot create more than ${MAX_APP_COUNT} apps`,
      );
    }

    if (input.spaceId !== null) {
      const space = await repos.spaceRepository.findById(
        SpaceDomainSpaceId.create(input.spaceId),
      );
      if (space === null) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `Space ${input.spaceId} not found`,
        );
      }
    }

    const sourceApp = await repos.appRepository.findById(sourceAppId);
    if (sourceApp === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Source app ${input.sourceAppId} not found`,
      );
    }

    const result = await container.appCreationService.duplicateApp(
      sourceAppId,
      input.name,
      spaceId,
    );

    await repos.appRepository.save(result.app);
    for (const field of result.fields) {
      await repos.fieldRepository.save(field);
    }
    if (result.formLayout !== null) {
      await repos.formLayoutRepository.save(result.formLayout);
    }
    for (const view of result.views) {
      await repos.viewRepository.save(view);
    }
    for (const report of result.reports) {
      await repos.reportRepository.save(report);
    }

    return {
      appId: result.app.appId,
      name: result.app.name,
      status: "PREVIEW" as const,
      revision: result.app.revision,
      createdAt: result.app.createdAt,
    };
  });
}
