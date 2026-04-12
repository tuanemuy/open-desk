import { container } from "@/core/application/container/server.instance";
import { updateLocale } from "@/core/application/system-settings/updateLocale";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { saveLocaleSchema } from "./schemas";

export const handlers = {
  saveLocale: defineHandler({
    schema: saveLocaleSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateLocale({
          container,
          headers: args.request.headers,
          input: {
            timezone: value.timezone,
            language: value.language,
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
