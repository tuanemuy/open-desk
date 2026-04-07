import { z } from "zod";
import {
  createCompositeAction,
  defineHandler,
  success,
} from "@/lib/compositeAction";
import type { Route } from "./+types/index";

const updateTimeFormatSchema = z.object({
  timeFormat: z.enum(["12h", "24h"]),
});

export const handlers = {
  updateTimeFormat: defineHandler({
    schema: updateTimeFormatSchema,
    handler: async (_value, _args) => {
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
