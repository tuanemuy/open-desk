import type { AppId } from "@/core/domain/app/valueObject";
import type { RecordValidationService } from "@/core/domain/record/services/recordValidationService";
import type {
  FieldCode as FieldCodeType,
  FieldValue,
} from "@/core/domain/record/valueObject";

export class StubRecordValidationService implements RecordValidationService {
  validateFieldValues(
    _appId: AppId,
    _fieldValues: ReadonlyMap<FieldCodeType, FieldValue>,
    _isUpdate: boolean,
  ): Promise<void> {
    throw new Error("Not implemented");
  }
}
