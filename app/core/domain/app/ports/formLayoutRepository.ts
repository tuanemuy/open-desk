import type { FormLayout } from "../entity";
import type { AppId } from "../valueObject";

export interface FormLayoutRepository {
  findByAppId(appId: AppId): Promise<FormLayout | null>;
  save(layout: FormLayout): Promise<void>;
}
