import type { FilterCondEvaluator } from "@/core/domain/access-control/ports/filterCondEvaluator";
import type { FieldValue as FieldValueType } from "@/core/domain/access-control/valueObject";
import type { FieldCode as FieldCodeType } from "@/core/domain/app/valueObject";

export class StubFilterCondEvaluator implements FilterCondEvaluator {
  evaluate(
    _filterCond: string | null,
    _fieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
  ): boolean {
    throw new Error("Not implemented");
  }
}
