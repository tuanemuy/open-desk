import type { ProcessDefinition } from "../entity";
import type { AppId } from "../valueObject";

export interface ProcessDefinitionRepository {
  findByAppId(appId: AppId): Promise<ProcessDefinition | null>;
  save(definition: ProcessDefinition): Promise<void>;
}
