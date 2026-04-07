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

export async function loader({
  params,
}: Route.LoaderArgs): Promise<AppSettingsLoaderData> {
  const appId = params.appId;

  const app: AppInfo = {
    id: appId,
    name: "Customer List",
    spaceName: "Sales Support Space",
    spaceId: "1",
  };

  const tabs: SettingsTab[] = [
    { id: "form", label: "Form" },
    { id: "list", label: "List" },
    { id: "graph", label: "Graph" },
    { id: "settings", label: "Settings" },
  ];

  const fieldRows: FieldRow[] = [
    {
      id: "row-record-no",
      fields: [
        {
          id: "record_no",
          name: "Record No.",
          type: "Record Number",
          required: false,
        },
      ],
    },
    {
      id: "row-company",
      fields: [
        {
          id: "company",
          name: "Company",
          type: "Text (single line)",
          required: true,
        },
        {
          id: "department",
          name: "Department",
          type: "Text (single line)",
          required: false,
        },
        {
          id: "person",
          name: "Contact",
          type: "Text (single line)",
          required: false,
        },
      ],
    },
    {
      id: "row-contact",
      fields: [
        {
          id: "postal_code",
          name: "Postal Code",
          type: "Text (single line)",
          required: false,
        },
        {
          id: "tel",
          name: "TEL",
          type: "Text (single line)",
          required: false,
        },
        {
          id: "fax",
          name: "FAX",
          type: "Text (single line)",
          required: false,
        },
      ],
    },
    {
      id: "row-address",
      fields: [
        {
          id: "address",
          name: "Address",
          type: "Text (single line)",
          required: false,
          flex: 2,
        },
        {
          id: "rank",
          name: "Customer Rank",
          type: "Dropdown",
          required: false,
          flex: 1,
        },
      ],
    },
    {
      id: "row-email",
      fields: [
        { id: "email", name: "Email", type: "Link", required: false },
        {
          id: "logo",
          name: "Company Logo",
          type: "Attachment",
          required: false,
        },
      ],
    },
    {
      id: "row-notes",
      fields: [
        {
          id: "notes",
          name: "Notes",
          type: "Text (multi-line)",
          required: false,
        },
      ],
    },
  ];

  const paletteChips: PaletteChip[] = [
    { label: "Text (single line)", system: false },
    { label: "Text (multi-line)", system: false },
    { label: "Rich editor", system: false },
    { label: "Number", system: false },
    { label: "Calculation", system: false },
    { label: "Radio button", system: false },
    { label: "Checkbox", system: false },
    { label: "Multi-select", system: false },
    { label: "Dropdown", system: false },
    { label: "Date", system: false },
    { label: "Time", system: false },
    { label: "Date/Time", system: false },
    { label: "Attachment", system: false },
    { label: "Link", system: false },
    { label: "User select", system: false },
    { label: "Org select", system: false },
    { label: "Group select", system: false },
    { label: "Table", system: false },
    { label: "Related records", system: false },
    { label: "Lookup", system: false },
    { label: "Label", system: false },
    { label: "Space", system: false },
    { label: "Separator", system: false },
    { label: "Group", system: false },
    { label: "Record No.", system: true },
    { label: "Creator", system: true },
    { label: "Updater", system: true },
    { label: "Created at", system: true },
    { label: "Updated at", system: true },
  ];

  return {
    app,
    tabs,
    activeTab: "form",
    fieldRows,
    paletteChips,
  };
}
