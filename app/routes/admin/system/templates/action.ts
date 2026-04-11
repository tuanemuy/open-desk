import { z } from "zod";
import { createAppTemplate } from "@/core/application/app/createAppTemplate";
import { deleteAppTemplate } from "@/core/application/app/deleteAppTemplate";
import { importAppTemplate } from "@/core/application/app/importAppTemplate";
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

const createTemplateSchema = z.object({
  sourceAppId: z.string().min(1, "アプリIDを入力してください"),
  name: z.string().min(1, "テンプレート名を入力してください"),
  description: z.string().optional(),
});

const deleteTemplateSchema = z.object({
  templateId: z.string().min(1),
});

export const handlers = {
  createTemplate: defineHandler({
    schema: createTemplateSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        createAppTemplate({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            sourceAppId: value.sourceAppId,
            name: value.name,
            description: value.description ?? null,
          },
        }),
      ).match(
        (result) => success({ template: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  importTemplate: defineHandler({
    handler: async (formData, args) => {
      const auth = await requireAuth(args.request, container);
      const file = formData.get("file") as File | null;
      const name = formData.get("name") as string | null;

      if (!file) {
        return error({ file: ["ファイルを選択してください"] });
      }
      if (!name || name.trim() === "") {
        return error({ name: ["テンプレート名を入力してください"] });
      }

      const buffer = await file.arrayBuffer();

      return handleUseCase(() =>
        importAppTemplate({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            file: buffer,
            name,
          },
        }),
      ).match(
        (result) => success({ template: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteTemplate: defineHandler({
    schema: deleteTemplateSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        deleteAppTemplate({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            templateId: value.templateId,
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
