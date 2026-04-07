import type { Route } from "./+types/index";

type FieldValue = {
  label: string;
  value: string;
  type: "text" | "email" | "image" | "badge";
};

type RecordRow = {
  id: string;
  fields: FieldValue[];
  flex?: number[];
};

type CommentItem = {
  id: string;
  author: string;
  initial: string;
  avatarColor: "blue" | "green";
  time: string;
  text: string;
};

type AppInfo = {
  id: string;
  name: string;
  spaceName: string;
  spaceId: string;
};

export type RecordDetailLoaderData = {
  app: AppInfo;
  recordId: string;
  rows: RecordRow[];
  comments: CommentItem[];
};

export async function loader({
  params,
}: Route.LoaderArgs): Promise<RecordDetailLoaderData> {
  const appId = params.appId;
  const recordId = params.recordId;

  const app: AppInfo = {
    id: appId,
    name: "Customer List",
    spaceName: "Your Team Communication Space",
    spaceId: "1",
  };

  const rows: RecordRow[] = [
    {
      id: "row-record-no",
      fields: [{ label: "Record No.", value: "1", type: "text" }],
    },
    {
      id: "row-company",
      fields: [
        { label: "Company", value: "Yamada Trading Co., Ltd.", type: "text" },
        { label: "Department", value: "Sales", type: "text" },
        { label: "Contact", value: "Taro Tanaka", type: "text" },
      ],
    },
    {
      id: "row-contact",
      fields: [
        { label: "Postal Code", value: "1000001", type: "text" },
        { label: "TEL", value: "0312345678", type: "text" },
        { label: "FAX", value: "0312345679", type: "text" },
      ],
    },
    {
      id: "row-address",
      fields: [
        {
          label: "Address",
          value: "1-1-1 Marunouchi, Chiyoda-ku, Tokyo",
          type: "text",
        },
        { label: "Customer Rank", value: "A", type: "badge" },
      ],
      flex: [2, 1],
    },
    {
      id: "row-email",
      fields: [
        {
          label: "Email",
          value: "tanaka@yamada-shoji.co.jp",
          type: "email",
        },
        { label: "Company Logo", value: "150 x 100", type: "image" },
      ],
    },
    {
      id: "row-notes",
      fields: [
        {
          label: "Notes",
          value:
            "New business started in April 2024. Primarily handles wholesale of electronic components.\nRegular meetings held on the second Tuesday of each month.\nNext quote submission deadline is end of June 2024. Mr. Tanaka prefers morning communication.",
          type: "text",
        },
      ],
    },
  ];

  const comments: CommentItem[] = [
    {
      id: "1",
      author: "Jiro Yamada",
      initial: "Y",
      avatarColor: "blue",
      time: "2024/05/15 10:32",
      text: "Sent the new catalog to Mr. Tanaka. Will check the response at next week's regular meeting.",
    },
    {
      id: "2",
      author: "Keiko Sato",
      initial: "S",
      avatarColor: "green",
      time: "2024/05/14 15:48",
      text: "Received an additional order inquiry from the client. Will create a quote and share it. Desired delivery is the second week of June.",
    },
    {
      id: "3",
      author: "Jiro Yamada",
      initial: "Y",
      avatarColor: "blue",
      time: "2024/05/10 09:15",
      text: "Changed customer rank from B to A. Based on transaction record over the past 3 months.",
    },
  ];

  return {
    app,
    recordId,
    rows,
    comments,
  };
}
