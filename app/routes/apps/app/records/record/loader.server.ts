import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { getComments } from "@/core/application/record/getComments";
import { getHistory } from "@/core/application/record/getHistory";
import { getRecord } from "@/core/application/record/getRecord";
import { AppId } from "@/core/domain/app/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
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

type HistoryFieldChange = {
  fieldCode: string;
  oldValue: string;
  newValue: string;
};

type HistoryItem = {
  id: string;
  version: number;
  modifier: string;
  modifiedAt: string;
  changes: HistoryFieldChange[];
};

export type RecordDetailLoaderData = {
  app: AppInfo;
  recordId: string;
  rows: RecordRow[];
  comments: CommentItem[];
  histories: HistoryItem[];
};

export async function loader({
  params,
  request,
}: Route.LoaderArgs): Promise<RecordDetailLoaderData> {
  await requireAuth(request, container);

  const appId = params.appId;
  const recordId = params.recordId;

  const { appEntity, fields } = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      const found = await ctx.appRepository.findById(AppId.create(appId));
      const fieldList = await ctx.fieldRepository.findByAppId(
        AppId.create(appId),
      );
      return { appEntity: found, fields: fieldList };
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

  const app: AppInfo = {
    id: appEntity.appId as string,
    name: appEntity.name as string,
    spaceName,
    spaceId: (appEntity.spaceId as string) ?? "",
  };

  const fieldLabelMap = new Map<string, string>();
  const fieldTypeMap = new Map<string, string>();
  for (const f of fields) {
    fieldLabelMap.set(f.fieldCode as string, f.label);
    fieldTypeMap.set(f.fieldCode as string, f.fieldType as string);
  }

  const recordResult = await handleUseCase(() =>
    getRecord({
      container,
      headers: request.headers,
      input: { appId, recordId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const rows: RecordRow[] = [];
  for (const [code, val] of recordResult.record.fieldValues) {
    const codeStr = code as string;
    const label = fieldLabelMap.get(codeStr) ?? codeStr;
    const rawType = fieldTypeMap.get(codeStr) ?? "";
    let displayType: FieldValue["type"] = "text";
    if (rawType === "LINK" && codeStr.toLowerCase().includes("email")) {
      displayType = "email";
    } else if (rawType === "FILE") {
      displayType = "image";
    } else if (rawType === "DROP_DOWN") {
      displayType = "badge";
    }
    const displayValue =
      "value" in val
        ? Array.isArray(val.value)
          ? (val.value as string[]).join(", ")
          : String(val.value)
        : "";
    rows.push({
      id: `row-${codeStr}`,
      fields: [{ label, value: displayValue, type: displayType }],
    });
  }

  const commentsResult = await handleUseCase(() =>
    getComments({
      container,
      headers: request.headers,
      input: { appId, recordId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const avatarColors: ("blue" | "green")[] = ["blue", "green"];
  const authorColorMap = new Map<string, "blue" | "green">();
  let colorIndex = 0;

  const comments: CommentItem[] = await Promise.all(
    commentsResult.comments.map(async (c) => {
      let authorName = c.creatorId as string;
      const user = await container.unitOfWorkProvider.transaction(async (ctx) =>
        ctx.userRepository.findById(
          c.creatorId as import("@/core/domain/identity/valueObject").UserId,
        ),
      );
      if (user) {
        authorName = user.displayName as string;
      }

      if (!authorColorMap.has(authorName)) {
        authorColorMap.set(
          authorName,
          avatarColors[colorIndex % avatarColors.length] as "blue" | "green",
        );
        colorIndex++;
      }

      return {
        id: c.commentId as string,
        author: authorName,
        initial: authorName.charAt(0).toUpperCase(),
        avatarColor: authorColorMap.get(authorName) as "blue" | "green",
        time: formatDate(c.createdAt),
        text: c.text,
      };
    }),
  );

  const historyResult = await handleUseCase(() =>
    getHistory({
      container,
      headers: request.headers,
      input: { appId, recordId },
    }),
  ).match(
    (result) => result,
    () => ({
      histories:
        [] as import("@/core/application/record/dto").RecordHistoryDto[],
    }),
  );

  const histories: HistoryItem[] = await Promise.all(
    historyResult.histories.map(async (h) => {
      let modifierName = h.modifierId as string;
      const user = await container.unitOfWorkProvider.transaction(async (ctx) =>
        ctx.userRepository.findById(
          h.modifierId as import("@/core/domain/identity/valueObject").UserId,
        ),
      );
      if (user) {
        modifierName = user.displayName as string;
      }

      return {
        id: h.historyId as string,
        version: h.version,
        modifier: modifierName,
        modifiedAt: formatDate(h.modifiedAt),
        changes: h.changedFields.map((diff) => ({
          fieldCode: diff.fieldCode as string,
          oldValue: diff.oldValue,
          newValue: diff.newValue,
        })),
      };
    }),
  );

  return {
    app,
    recordId,
    rows,
    comments,
    histories,
  };
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${h}:${min}`;
}
