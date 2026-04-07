import type {
  FieldCode,
  FieldDiff,
  FieldValue,
} from "@/core/domain/record/valueObject";

/**
 * Build field diffs by comparing old and new field value maps.
 * Returns diffs for fields that have changed.
 */
export function buildFieldDiffs(
  oldValues: ReadonlyMap<FieldCode, FieldValue>,
  newValues: ReadonlyMap<FieldCode, FieldValue>,
): FieldDiff[] {
  const diffs: FieldDiff[] = [];

  for (const [fieldCode, newValue] of newValues) {
    const oldValue = oldValues.get(fieldCode);
    const oldStr = oldValue ? JSON.stringify(oldValue.value) : "";
    const newStr = JSON.stringify(newValue.value);

    if (oldStr !== newStr) {
      diffs.push({
        fieldCode,
        oldValue: oldStr,
        newValue: newStr,
      });
    }
  }

  return diffs;
}
