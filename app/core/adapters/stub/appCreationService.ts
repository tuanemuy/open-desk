import type {
  AppCreationResult,
  AppCreationService,
} from "@/core/domain/app/services/appCreationService";
import type { AppId, SpaceId } from "@/core/domain/app/valueObject";
import { StubNotImplementedError } from "./error";

export class StubAppCreationService implements AppCreationService {
  createFromTemplate(
    _templateId: AppId,
    _name: string,
    _spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    throw new StubNotImplementedError("AppCreationService");
  }

  createFromExcel(
    _file: ArrayBuffer,
    _name: string,
    _spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    throw new StubNotImplementedError("AppCreationService");
  }

  createFromCsv(
    _file: ArrayBuffer,
    _name: string,
    _spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    throw new StubNotImplementedError("AppCreationService");
  }

  duplicateApp(
    _sourceAppId: AppId,
    _name: string,
    _spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    throw new StubNotImplementedError("AppCreationService");
  }
}
