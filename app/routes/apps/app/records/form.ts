import { data } from "react-router";
import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import type { FieldValue } from "@/core/domain/record/valueObject";
import { AppId } from "@/core/domain/app/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";

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

type FieldDefinition = {
  fieldCode: string;
  properties: {
    type: string;
    options?: readonly {
      label: string;
    }[];
  };
};

export async function loadRecordFormBaseData(
  appId: string,
): Promise<{
  app: RecordFormAppInfo;
  rankOptions: RankOption[];
}> {
  const { appEntity, fields } = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      const found = await ctx.appRepository.findById(AppId.create(appId));
      const fieldList = await ctx.fieldRepository.findByAppId(
        AppId.create(appId),
      );
      return {
        appEntity: found,
        fields: fieldList as readonly FieldDefinition[],
      };
    },
  );

  if (!appEntity) {
    throw data({ message: "App not found" }, { status: 404 });
  }

  let spaceName = "";
  if (appEntity.spaceId) {
    const space = await container.unitOfWorkProvider.transaction(async (ctx) =>
      ctx.spaceRepository.findById(appEntity.spaceId as unknown as SpaceId),
    );
    if (space) {
      spaceName = space.name as string;
    }
  }

  const rankOptions: RankOption[] = [{ value: "", label: "-----" }];
  for (const field of fields) {
    if (
      field.properties.type === "DROP_DOWN" &&
      field.fieldCode === "customer_rank"
    ) {
      for (const option of field.properties.options ?? []) {
        rankOptions.push({ value: option.label, label: option.label });
      }
    }
  }

  return {
    app: {
      id: appEntity.appId as string,
      name: appEntity.name as string,
      spaceName,
      spaceId: (appEntity.spaceId as string) ?? "",
    },
    rankOptions,
  };
}

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
  setFieldValue(fieldValues, "tel", "SINGLE_LINE_TEXT", value.tel, includeEmpty);
  setFieldValue(fieldValues, "fax", "SINGLE_LINE_TEXT", value.fax, includeEmpty);
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

    if (Array.isArray(value.value)) {
      return value.value.join(", ");
    }

    return String(value.value ?? "");
  }

  return "";
}
