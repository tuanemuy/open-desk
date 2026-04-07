import { z } from "zod";
import {
  createCompositeAction,
  defineHandler,
  success,
} from "@/lib/compositeAction";
import type { Route } from "./+types/index";

const addCommentSchema = z.object({
  comment: z.string().min(1, "Please enter a comment"),
});

export const handlers = {
  addComment: defineHandler({
    schema: addCommentSchema,
    handler: async (_value, _args) => {
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
