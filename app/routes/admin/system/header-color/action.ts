import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  success,
} from "@/lib/compositeAction";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const updateHeaderColorSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "有効なHEXカラーコードを入力してください"),
});

export const handlers = {
  updateHeaderColor: defineHandler({
    schema: updateHeaderColorSchema,
    handler: async (_value, args) => {
      await requireAuth(args.request, container);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
