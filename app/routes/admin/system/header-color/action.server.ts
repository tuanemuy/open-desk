import { container } from "@/core/application/container/server.instance";
import { updateHeaderColor } from "@/core/application/system-settings/updateHeaderColor";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { updateHeaderColorSchema } from "./schemas";

export const handlers = {
  updateHeaderColor: defineHandler({
    schema: updateHeaderColorSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        updateHeaderColor({
          container,
          headers: args.request.headers,
          input: { hex: value.color },
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
