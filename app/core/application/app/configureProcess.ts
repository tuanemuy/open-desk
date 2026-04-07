import type { ProcessDefinition as ProcessDefinitionType } from "@/core/domain/app/entity";
import { ProcessDefinition } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type { ProcessTransitionInput } from "@/core/domain/app/valueObject";
import {
  AppId,
  AppStatus,
  ProcessStatusId,
  Revision,
} from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ConfigureProcessOutput } from "./dto";

export type ProcessStatusInput = {
  statusId: string | null;
  name: string;
};

export type ConfigureProcessInput = {
  appId: string;
  isEnabled: boolean;
  statuses: ProcessStatusInput[];
  transitions: ProcessTransitionInput[];
  revision: number;
  modifierId: string;
};

export async function configureProcess({
  container,
  input,
}: ServiceArgs<ConfigureProcessInput>): Promise<ConfigureProcessOutput> {
  const appId = AppId.create(input.appId);
  const expectedRevision = Revision.create(input.revision);
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

    let definition: ProcessDefinitionType =
      (await repos.processDefinitionRepository.findByAppId(appId)) ??
      ProcessDefinition.create({ appId });

    // Check revision for existing definitions (non-initial revision)
    if (definition.revision !== Revision.initial()) {
      if (definition.revision !== expectedRevision) {
        throw new BusinessRuleError(
          AppErrorCode.RevisionConflict,
          `Revision conflict: expected ${expectedRevision}, got ${definition.revision}`,
        );
      }
    }

    if (input.isEnabled) {
      // Clear all transitions first to allow status manipulation
      for (const transition of [...definition.transitions]) {
        definition = ProcessDefinition.removeTransition(
          definition,
          transition.transitionId,
        );
      }

      // Remove statuses that are not in the new list (reverse order to avoid initial status issue)
      const newStatusIdSet = new Set(
        input.statuses
          .filter((s) => s.statusId !== null)
          .map((s) => s.statusId as string),
      );

      const statusesToRemove = definition.statuses.filter(
        (s) => !newStatusIdSet.has(s.statusId as string),
      );

      // Remove non-initial statuses first
      for (const status of statusesToRemove.slice().reverse()) {
        if (
          definition.statuses.length > 0 &&
          definition.statuses[0].statusId === status.statusId
        ) {
          continue; // Skip initial for now
        }
        definition = ProcessDefinition.removeStatus(
          definition,
          status.statusId,
        );
      }

      // If the initial status needs to be removed, rebuild from scratch
      if (
        definition.statuses.length > 0 &&
        statusesToRemove.some(
          (s) => s.statusId === definition.statuses[0].statusId,
        )
      ) {
        // Start fresh
        definition = ProcessDefinition.reconstruct({
          appId: definition.appId,
          isEnabled: definition.isEnabled,
          statuses: [],
          transitions: [],
          revision: definition.revision,
        });
      }

      // Rename existing statuses and add new ones
      for (const statusInput of input.statuses) {
        if (
          statusInput.statusId !== null &&
          definition.statuses.some((s) => s.statusId === statusInput.statusId)
        ) {
          definition = ProcessDefinition.renameStatus(
            definition,
            ProcessStatusId.create(statusInput.statusId),
            statusInput.name,
          );
        } else {
          definition = ProcessDefinition.addStatus(
            definition,
            statusInput.name,
            null,
          );
        }
      }

      // Reorder statuses to match input order
      const orderedIds = input.statuses.map((s) => {
        if (
          s.statusId !== null &&
          definition.statuses.some((ds) => ds.statusId === s.statusId)
        ) {
          return ProcessStatusId.create(s.statusId);
        }
        // For newly added statuses, find by name
        const found = definition.statuses.find((ds) => ds.name === s.name);
        if (found) {
          return found.statusId;
        }
        return definition.statuses[definition.statuses.length - 1].statusId;
      });
      definition = ProcessDefinition.reorderStatuses(definition, orderedIds);

      // Add transitions
      for (const transitionInput of input.transitions) {
        definition = ProcessDefinition.addTransition(
          definition,
          transitionInput,
        );
      }

      definition = ProcessDefinition.enable(definition);
    } else {
      definition = ProcessDefinition.disable(definition);
    }

    // Increment revision
    definition = ProcessDefinition.reconstruct({
      ...definition,
      revision: Revision.increment(definition.revision),
    });

    await repos.processDefinitionRepository.save(definition);

    return {
      appId: definition.appId,
      isEnabled: definition.isEnabled,
      statuses: [...definition.statuses],
      transitions: [...definition.transitions],
      revision: definition.revision,
    };
  });
}
