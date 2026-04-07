import { App } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type { SpaceId, ThreadId } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { SpaceId as SpaceDomainSpaceId } from "@/core/domain/space/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { CreateAppOutput } from "./dto";

const MAX_APP_COUNT = 1000;

export type CreateAppBlankInput = {
  name: string;
  spaceId: string | null;
  threadId: string | null;
  creatorId: string;
};

export async function createAppBlank({
  container,
  input,
}: ServiceArgs<CreateAppBlankInput>): Promise<CreateAppOutput> {
  const creatorId = UserId.create(input.creatorId);
  const spaceId: SpaceId | null = input.spaceId
    ? (input.spaceId as unknown as SpaceId)
    : null;
  const threadId: ThreadId | null = input.threadId
    ? (input.threadId as unknown as ThreadId)
    : null;

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

    const { entity: app } = App.create({
      name: input.name,
      creatorId,
      spaceId,
      threadId,
    });

    await repos.appRepository.save(app);

    return {
      appId: app.appId,
      name: app.name,
      status: "PREVIEW" as const,
      revision: app.revision,
      createdAt: app.createdAt,
    };
  });
}
