import { z } from "zod";
import { deletePlugin } from "@/core/application/app/deletePlugin";
import { importPlugin } from "@/core/application/app/importPlugin";
import { updatePluginStatus } from "@/core/application/app/updatePluginStatus";
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

const updatePluginStatusSchema = z.object({
  pluginId: z.string().min(1),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const deletePluginSchema = z.object({
  pluginId: z.string().min(1),
});

export const handlers = {
  importPlugin: defineHandler({
    handler: async (formData, args) => {
      const auth = await requireAuth(args.request, container);
      const file = formData.get("file") as File | null;

      if (!file || file.size === 0) {
        return error({ "": ["ファイルを選択してください"] });
      }

      const arrayBuffer = await file.arrayBuffer();

      return handleUseCase(() =>
        importPlugin({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            file: arrayBuffer,
          },
        }),
      ).match(
        (result) => success({ plugin: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  updatePluginStatus: defineHandler({
    schema: updatePluginStatusSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        updatePluginStatus({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            pluginId: value.pluginId,
            isActive: value.isActive,
          },
        }),
      ).match(
        (result) => success({ plugin: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deletePlugin: defineHandler({
    schema: deletePluginSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        deletePlugin({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            pluginId: value.pluginId,
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
