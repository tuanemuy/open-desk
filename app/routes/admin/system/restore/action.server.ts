import { z } from "zod";
import { restoreApp } from "@/core/application/app/restoreApp";
import { container } from "@/core/application/container/server.instance";
import { restoreSpace } from "@/core/application/space/restoreSpace";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const restoreAppSchema = z.object({
  appId: z.string().min(1, "アプリIDを入力してください"),
});

const restoreSpaceSchema = z.object({
  spaceId: z.string().min(1, "スペースIDを入力してください"),
});

export const handlers = {
  restoreApp: defineHandler({
    schema: restoreAppSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        restoreApp({
          container,
          headers: args.request.headers,
          input: {
            appId: value.appId,
            executorId: auth.userId,
          },
        }),
      ).match(
        (result) => success({ appId: result.appId }),
        (e) => error({ appId: [e.message] }),
      );
    },
  }),
  restoreSpace: defineHandler({
    schema: restoreSpaceSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        restoreSpace({
          container,
          headers: args.request.headers,
          input: {
            spaceId: value.spaceId,
            operatorId: auth.userId,
          },
        }),
      ).match(
        (result) => success({ spaceId: result.spaceId }),
        (e) => error({ spaceId: [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
