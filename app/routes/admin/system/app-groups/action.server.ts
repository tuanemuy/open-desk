import { z } from "zod";
import { createAppGroup } from "@/core/application/app/createAppGroup";
import { deleteAppGroup } from "@/core/application/app/deleteAppGroup";
import { updateAppGroup } from "@/core/application/app/updateAppGroup";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const createAppGroupSchema = z.object({
  name: z.string().min(1, "グループ名を入力してください"),
});

const updateAppGroupSchema = z.object({
  appGroupId: z.string().min(1),
  name: z.string().optional(),
  isDefault: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "on")),
  appIds: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return JSON.parse(v) as string[];
    }),
});

const deleteAppGroupSchema = z.object({
  appGroupId: z.string().min(1),
});

export const handlers = {
  createAppGroup: defineHandler({
    schema: createAppGroupSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        createAppGroup({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            name: value.name,
          },
        }),
      ).match(
        (result) => success({ group: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  updateAppGroup: defineHandler({
    schema: updateAppGroupSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateAppGroup({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            appGroupId: value.appGroupId,
            name: value.name,
            isDefault: value.isDefault,
            appIds: value.appIds,
          },
        }),
      ).match(
        (result) => success({ group: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteAppGroup: defineHandler({
    schema: deleteAppGroupSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        deleteAppGroup({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            appGroupId: value.appGroupId,
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
