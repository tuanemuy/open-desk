import type { FieldValue as FieldValueType } from "@/core/domain/access-control/valueObject";
import type { FieldCode as FieldCodeType } from "@/core/domain/app/valueObject";

/**
 * Port for evaluating record ACL filter conditions against record field values.
 * Depends on the query engine implementation, hence defined as a port.
 */
export interface FilterCondEvaluator {
  /**
   * Evaluate whether a filter condition matches the given record field values.
   *
   * @param filterCond The query string. If null, matches all records.
   * @param fieldValues The record's field values map.
   * @returns true if the condition matches.
   */
  evaluate(
    filterCond: string | null,
    fieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
  ): boolean;
}
