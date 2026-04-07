import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  success,
} from "@/lib/compositeAction";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const saveSchema = z.object({
  ipRestriction: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  ipAllowList: z.string().optional().default(""),
  basicAuth: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export const handlers = {
  save: defineHandler({
    schema: saveSchema,
    handler: async (_value, args) => {
      await requireAuth(args.request, container);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
