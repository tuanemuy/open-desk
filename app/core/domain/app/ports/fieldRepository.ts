import type { Field } from "../entity";
import type { AppId, FieldCode, FieldId } from "../valueObject";

export interface FieldRepository {
  findById(fieldId: FieldId): Promise<Field | null>;
  findByAppId(appId: AppId): Promise<readonly Field[]>;
  findByCode(appId: AppId, fieldCode: FieldCode): Promise<Field | null>;
  save(field: Field): Promise<void>;
  saveBatch(fields: readonly Field[]): Promise<void>;
  delete(fieldId: FieldId): Promise<void>;
  deleteBatch(fieldIds: readonly FieldId[]): Promise<void>;
  existsByCode(
    appId: AppId,
    fieldCode: FieldCode,
    excludeFieldId?: FieldId,
  ): Promise<boolean>;
  countByAppId(appId: AppId): Promise<number>;
}
