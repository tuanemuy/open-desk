import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { createThreadAction } from "@/core/application/space/createThreadAction";
import { deleteThreadAction } from "@/core/application/space/deleteThreadAction";
import { updateThreadAction } from "@/core/application/space/updateThreadAction";
import { ThreadActionFieldMapping } from "@/core/domain/space/valueObject";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type FieldMappingEntry = {
  sourceField:
    | "COMMENTER"
    | "COMMENT_DATETIME"
    | "COMMENT_TEXT"
    | "SPACE_NAME"
    | "THREAD_TITLE";
  destinationFieldCode: string;
};

function parseFieldMappingsJson(
  v: string | undefined,
  ctx: z.RefinementCtx,
): FieldMappingEntry[] | undefined {
  if (v === undefined) return undefined;
  if (!v) return [];
  try {
    return JSON.parse(v) as FieldMappingEntry[];
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "フィールドマッピングのJSON形式が不正です",
    });
    return z.NEVER;
  }
}

const createThreadActionSchema = z.object({
  actionName: z.string().min(1, "アクション名を入力してください"),
  destinationAppId: z.string().min(1, "コピー先アプリIDを入力してください"),
  fieldMappings: z
    .string()
    .optional()
    .transform((v, ctx) => parseFieldMappingsJson(v, ctx) ?? []),
});

const updateThreadActionSchema = z.object({
  threadActionId: z.string().min(1),
  actionName: z.string().optional(),
  destinationAppId: z.string().optional(),
  fieldMappings: z
    .string()
    .optional()
    .transform((v, ctx) => parseFieldMappingsJson(v, ctx)),
});

const deleteThreadActionSchema = z.object({
  threadActionId: z.string().min(1),
});

export const handlers = {
  createThreadAction: defineHandler({
    schema: createThreadActionSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      const fieldMappings = value.fieldMappings.map((m) =>
        ThreadActionFieldMapping.create({
          sourceField: m.sourceField,
          destinationFieldCode: m.destinationFieldCode,
        }),
      );

      return handleUseCase(() =>
        createThreadAction({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            actionName: value.actionName,
            destinationAppId: value.destinationAppId,
            fieldMappings,
          },
        }),
      ).match(
        (result) => success({ action: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  updateThreadAction: defineHandler({
    schema: updateThreadActionSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      const fieldMappings = value.fieldMappings?.map((m) =>
        ThreadActionFieldMapping.create({
          sourceField: m.sourceField,
          destinationFieldCode: m.destinationFieldCode,
        }),
      );

      return handleUseCase(() =>
        updateThreadAction({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            threadActionId: value.threadActionId,
            actionName: value.actionName,
            destinationAppId: value.destinationAppId,
            fieldMappings,
          },
        }),
      ).match(
        (result) => success({ action: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteThreadAction: defineHandler({
    schema: deleteThreadActionSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        deleteThreadAction({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            threadActionId: value.threadActionId,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
