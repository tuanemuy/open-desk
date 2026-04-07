import { AppCustomization } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type {
  CustomizationFile,
  CustomizationScope as CustomizationScopeType,
} from "@/core/domain/app/valueObject";
import { AppId, AppStatus, Revision } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ManageCustomizationOutput } from "./dto";

export type ManageCustomizationInput = {
  appId: string;
  scope: CustomizationScopeType;
  desktopJs: CustomizationFile[] | null;
  desktopCss: CustomizationFile[] | null;
  mobileJs: CustomizationFile[] | null;
  mobileCss: CustomizationFile[] | null;
  revision: number;
  modifierId: string;
};

export async function manageCustomization({
  container,
  input,
}: ServiceArgs<ManageCustomizationInput>): Promise<ManageCustomizationOutput> {
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

    let customization =
      await repos.appCustomizationRepository.findByAppId(appId);
    if (customization === null) {
      customization = AppCustomization.create({ appId });
    } else {
      if (customization.revision !== expectedRevision) {
        throw new BusinessRuleError(
          AppErrorCode.RevisionConflict,
          `Revision conflict: expected ${expectedRevision}, got ${customization.revision}`,
        );
      }
    }

    customization = AppCustomization.setScope(customization, input.scope);

    if (input.desktopJs !== null) {
      customization = AppCustomization.setDesktopJs(
        customization,
        input.desktopJs,
      );
    }

    if (input.desktopCss !== null) {
      customization = AppCustomization.setDesktopCss(
        customization,
        input.desktopCss,
      );
    }

    if (input.mobileJs !== null) {
      customization = AppCustomization.setMobileJs(
        customization,
        input.mobileJs,
      );
    }

    if (input.mobileCss !== null) {
      customization = AppCustomization.setMobileCss(
        customization,
        input.mobileCss,
      );
    }

    // Increment revision
    customization = {
      ...customization,
      revision: Revision.increment(customization.revision),
    };

    await repos.appCustomizationRepository.save(customization);

    return {
      appId: customization.appId,
      scope: customization.scope,
      revision: customization.revision,
    };
  });
}
