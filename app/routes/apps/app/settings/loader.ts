import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { AppId } from "@/core/domain/app/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type AppInfo = {
  id: string;
  name: string;
  spaceName: string;
  spaceId: string;
};

type FieldDefinition = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  flex?: number;
};

type FieldRow = {
  id: string;
  fields: FieldDefinition[];
};

type PaletteChip = {
  label: string;
  system: boolean;
};

type SettingsTab = {
  id: string;
  label: string;
};

export type AppSettingsLoaderData = {
  app: AppInfo;
  tabs: SettingsTab[];
  activeTab: string;
  fieldRows: FieldRow[];
  paletteChips: PaletteChip[];
};

const FIELD_TYPE_LABELS: Record<string, string> = {
  SINGLE_LINE_TEXT: "Text (single line)",
  MULTI_LINE_TEXT: "Text (multi-line)",
  RICH_TEXT: "Rich editor",
  NUMBER: "Number",
  CALC: "Calculation",
  RADIO_BUTTON: "Radio button",
  CHECK_BOX: "Checkbox",
  MULTI_SELECT: "Multi-select",
  DROP_DOWN: "Dropdown",
  DATE: "Date",
  TIME: "Time",
  DATETIME: "Date/Time",
  FILE: "Attachment",
  LINK: "Link",
  USER_SELECT: "User select",
  ORGANIZATION_SELECT: "Org select",
  GROUP_SELECT: "Group select",
  SUBTABLE: "Table",
  REFERENCE_TABLE: "Related records",
  LOOKUP: "Lookup",
  LABEL: "Label",
  SPACER: "Space",
  HR: "Separator",
  GROUP: "Group",
  RECORD_NUMBER: "Record No.",
  CREATOR: "Creator",
  MODIFIER: "Updater",
  CREATED_TIME: "Created at",
  UPDATED_TIME: "Updated at",
};

const SYSTEM_FIELD_TYPES = new Set([
  "RECORD_NUMBER",
  "CREATOR",
  "MODIFIER",
  "CREATED_TIME",
  "UPDATED_TIME",
]);

export async function loader({
  params,
  request,
}: Route.LoaderArgs): Promise<AppSettingsLoaderData> {
  await requireAuth(request, container);

  const appId = params.appId;

  const { appEntity, formLayout, fields } =
    await container.unitOfWorkProvider.transaction(async (ctx) => {
      const found = await ctx.appRepository.findById(AppId.create(appId));
      const layout = await ctx.formLayoutRepository.findByAppId(
        AppId.create(appId),
      );
      const fieldList = await ctx.fieldRepository.findByAppId(
        AppId.create(appId),
      );
      return { appEntity: found, formLayout: layout, fields: fieldList };
    });

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

  const app: AppInfo = {
    id: appEntity.appId as string,
    name: appEntity.name as string,
    spaceName,
    spaceId: (appEntity.spaceId as string) ?? "",
  };

  const fieldMap = new Map<
    string,
    { label: string; type: string; required: boolean; id: string }
  >();
  for (const f of fields) {
    fieldMap.set(f.fieldCode as string, {
      label: f.label,
      type: f.fieldType as string,
      required: f.required,
      id: f.fieldId as string,
    });
  }

  let fieldRows: FieldRow[] = [];
  if (formLayout) {
    fieldRows = formLayout.rows.map((row, rowIndex) => ({
      id: `row-${rowIndex}`,
      fields: row.fields.map((lf) => {
        const code = (lf.code as string) ?? "";
        const fieldInfo = fieldMap.get(code);
        const sizeWidth = lf.size?.width ?? null;
        return {
          id: code || (lf.elementId ?? `field-${rowIndex}-${code}`),
          name: lf.label ?? fieldInfo?.label ?? code,
          type:
            FIELD_TYPE_LABELS[fieldInfo?.type ?? lf.type] ??
            (fieldInfo?.type as string) ??
            (lf.type as string),
          required: fieldInfo?.required ?? false,
          ...(sizeWidth !== null ? { flex: sizeWidth } : {}),
        };
      }),
    }));
  } else {
    fieldRows = fields.map((f, i) => ({
      id: `row-${i}`,
      fields: [
        {
          id: f.fieldId as string,
          name: f.label,
          type:
            FIELD_TYPE_LABELS[f.fieldType as string] ?? (f.fieldType as string),
          required: f.required,
        },
      ],
    }));
  }

  const tabs: SettingsTab[] = [
    { id: "form", label: "Form" },
    { id: "list", label: "List" },
    { id: "graph", label: "Graph" },
    { id: "settings", label: "Settings" },
  ];

  const paletteChips: PaletteChip[] = Object.entries(FIELD_TYPE_LABELS).map(
    ([key, label]) => ({
      label,
      system: SYSTEM_FIELD_TYPES.has(key),
    }),
  );

  return {
    app,
    tabs,
    activeTab: "form",
    fieldRows,
    paletteChips,
  };
}
