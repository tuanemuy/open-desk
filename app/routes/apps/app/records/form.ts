import { z } from "zod";
import type { FieldValue } from "@/core/domain/record/valueObject";

export const recordFormSchema = z.object({
  company: z.string().optional(),
  department: z.string().optional(),
  person: z.string().optional(),
  postalCode: z.string().max(7, "Must be 7 characters or less").optional(),
  tel: z.string().optional(),
  fax: z.string().optional(),
  address: z.string().optional(),
  rank: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordFormValues = z.infer<typeof recordFormSchema>;

export type RecordFormAppInfo = {
  id: string;
  name: string;
  spaceName: string;
  spaceId: string;
};

export type RankOption = {
  value: string;
  label: string;
};

type EditableFieldValue = Extract<
  FieldValue,
  { type: "SINGLE_LINE_TEXT" | "MULTI_LINE_TEXT" | "DROP_DOWN" }
>;

const EMPTY_RECORD_FORM_VALUES: RecordFormValues = {
  company: "",
  department: "",
  person: "",
  postalCode: "",
  tel: "",
  fax: "",
  address: "",
  rank: "",
  email: "",
  notes: "",
};

export function emptyRecordFormValues(): RecordFormValues {
  return { ...EMPTY_RECORD_FORM_VALUES };
}

export function toRecordFormValues(
  fieldValues: ReadonlyMap<unknown, FieldValue>,
): RecordFormValues {
  return {
    company: getStringValue(fieldValues, "company_name"),
    department: getStringValue(fieldValues, "department"),
    person: getStringValue(fieldValues, "contact_name"),
    postalCode: getStringValue(fieldValues, "postal_code"),
    tel: getStringValue(fieldValues, "tel"),
    fax: getStringValue(fieldValues, "fax"),
    address: getStringValue(fieldValues, "address"),
    rank: getStringValue(fieldValues, "customer_rank"),
    email: getStringValue(fieldValues, "email"),
    notes: getStringValue(fieldValues, "notes"),
  };
}

export function toCreateRecordFieldValues(value: RecordFormValues) {
  return toRecordFieldValues(value, false);
}

/**
 * Update は画面に載っている全フィールドを常に送り返す（ダーティ追跡なし）。
 * 空入力は空文字として上書きされるため、ロード時に `toRecordFormValues` で
 * 現在値を `defaultValue` に入れておく前提が崩れるとバグ化する点に注意。
 */
export function toUpdateRecordFieldValues(value: RecordFormValues) {
  return toRecordFieldValues(value, true);
}

function toRecordFieldValues(
  value: RecordFormValues,
  includeEmpty: boolean,
): Map<string, FieldValue> {
  const fieldValues = new Map<string, FieldValue>();

  setFieldValue(
    fieldValues,
    "company_name",
    "SINGLE_LINE_TEXT",
    value.company,
    includeEmpty,
  );
  setFieldValue(
    fieldValues,
    "department",
    "SINGLE_LINE_TEXT",
    value.department,
    includeEmpty,
  );
  setFieldValue(
    fieldValues,
    "contact_name",
    "SINGLE_LINE_TEXT",
    value.person,
    includeEmpty,
  );
  setFieldValue(
    fieldValues,
    "postal_code",
    "SINGLE_LINE_TEXT",
    value.postalCode,
    includeEmpty,
  );
  setFieldValue(
    fieldValues,
    "tel",
    "SINGLE_LINE_TEXT",
    value.tel,
    includeEmpty,
  );
  setFieldValue(
    fieldValues,
    "fax",
    "SINGLE_LINE_TEXT",
    value.fax,
    includeEmpty,
  );
  setFieldValue(
    fieldValues,
    "address",
    "SINGLE_LINE_TEXT",
    value.address,
    includeEmpty,
  );
  setFieldValue(
    fieldValues,
    "customer_rank",
    "DROP_DOWN",
    value.rank,
    includeEmpty,
  );
  setFieldValue(
    fieldValues,
    "email",
    "SINGLE_LINE_TEXT",
    value.email,
    includeEmpty,
  );
  setFieldValue(
    fieldValues,
    "notes",
    "MULTI_LINE_TEXT",
    value.notes,
    includeEmpty,
  );

  return fieldValues;
}

function setFieldValue(
  fieldValues: Map<string, FieldValue>,
  fieldCode: string,
  type: EditableFieldValue["type"],
  rawValue: string | undefined,
  includeEmpty: boolean,
) {
  if (!includeEmpty && !rawValue) {
    return;
  }

  fieldValues.set(fieldCode, {
    type,
    value: rawValue ?? "",
  } as EditableFieldValue);
}

function getStringValue(
  fieldValues: ReadonlyMap<unknown, FieldValue>,
  fieldCode: string,
) {
  for (const [key, value] of fieldValues.entries()) {
    if (String(key) !== fieldCode || !("value" in value)) {
      continue;
    }

    if (value.value == null) {
      return "";
    }

    if (Array.isArray(value.value)) {
      return value.value.filter((v) => typeof v === "string").join(", ");
    }

    if (typeof value.value !== "string" && typeof value.value !== "number") {
      return "";
    }

    return String(value.value);
  }

  return "";
}
