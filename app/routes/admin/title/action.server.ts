import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { createTitle } from "@/core/application/identity/createTitle";
import { deleteTitle } from "@/core/application/identity/deleteTitle";
import { updateTitle } from "@/core/application/identity/updateTitle";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const createTitleSchema = z.object({
  name: z.string().min(1, "役職名を入力してください"),
  orderIndex: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : undefined)),
});

const updateTitleSchema = z.object({
  titleId: z.string().min(1),
  name: z.string().min(1, "役職名を入力してください"),
});

const deleteTitleSchema = z.object({
  titleId: z.string().min(1),
});

export const handlers = {
  createTitle: defineHandler({
    schema: createTitleSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        createTitle({
          container,
          headers: args.request.headers,
          input: {
            name: value.name,
            orderIndex: value.orderIndex,
          },
        }),
      ).match(
        (result) => success({ title: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  updateTitle: defineHandler({
    schema: updateTitleSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateTitle({
          container,
          headers: args.request.headers,
          input: {
            titleId: value.titleId,
            name: value.name,
          },
        }),
      ).match(
        (result) => success({ title: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteTitle: defineHandler({
    schema: deleteTitleSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        deleteTitle({
          container,
          headers: args.request.headers,
          input: {
            titleId: value.titleId,
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
