import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { updateGuestAuth } from "@/core/application/system-settings/updateGuestAuth";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const schema = z.object({
  twoFactorEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export const handlers = {
  updateGuestAuth: defineHandler({
    schema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        updateGuestAuth({
          container,
          headers: args.request.headers,
          input: { twoFactorEnabled: value.twoFactorEnabled },
        }),
      ).match(
        (result) => success({ data: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
