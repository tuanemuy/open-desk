import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { deleteUser } from "@/core/application/identity/deleteUser";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const deleteUserSchema = z.object({
  userId: z.string().min(1, "ユーザーIDが必要です"),
});

export const handlers = {
  deleteUser: defineHandler({
    schema: deleteUserSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        deleteUser({
          container,
          headers: args.request.headers,
          input: { userId: value.userId },
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
