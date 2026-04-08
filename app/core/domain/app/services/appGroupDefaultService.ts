import { BusinessRuleError } from "@/core/domain/error";
import { AppGroup as AppGroupEntity } from "../entity";
import { AppErrorCode } from "../errorCode";
import type { AppGroupRepository } from "../ports/appGroupRepository";
import type { AppGroupId } from "../valueObject";

/**
 * Dependencies for AppGroupDefaultService.
 */
export type AppGroupDefaultServiceDeps = {
  readonly appGroupRepository: AppGroupRepository;
};

/**
 * Set a specific app group as the default.
 * Ensures only one app group can be the default at any time.
 *
 * 1. If there is an existing default group, unset its default flag.
 * 2. Set the specified group as the default.
 * 3. Save both groups.
 *
 * @throws BusinessRuleError with AppGroupNotFound if the group does not exist
 */
export async function setDefaultGroup(
  deps: AppGroupDefaultServiceDeps,
  params: { appGroupId: AppGroupId },
): Promise<void> {
  const group = await deps.appGroupRepository.findById(params.appGroupId);
  if (group === null) {
    throw new BusinessRuleError(
      AppErrorCode.AppGroupNotFound,
      `App group not found: ${params.appGroupId}`,
    );
  }

  const currentDefault = await deps.appGroupRepository.findDefault();

  if (
    currentDefault !== null &&
    currentDefault.appGroupId !== group.appGroupId
  ) {
    const updatedCurrent = AppGroupEntity.setDefault(currentDefault, false);
    await deps.appGroupRepository.save(updatedCurrent);
  }

  const updatedGroup = AppGroupEntity.setDefault(group, true);
  await deps.appGroupRepository.save(updatedGroup);
}
