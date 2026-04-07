import type {
  AppCreationResult,
  AppCreationService,
} from "@/core/domain/app/services/appCreationService";
import type { AppId, SpaceId } from "@/core/domain/app/valueObject";

export class StubAppCreationService implements AppCreationService {
  createFromTemplate(
    _templateId: AppId,
    _name: string,
    _spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    throw new Error("Not implemented");
  }

  createFromExcel(
    _file: ArrayBuffer,
    _name: string,
    _spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    throw new Error("Not implemented");
  }

  createFromCsv(
    _file: ArrayBuffer,
    _name: string,
    _spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    throw new Error("Not implemented");
  }

  duplicateApp(
    _sourceAppId: AppId,
    _name: string,
    _spaceId: SpaceId | null,
  ): Promise<AppCreationResult> {
    throw new Error("Not implemented");
  }
}
