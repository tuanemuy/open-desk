import { container } from "@/core/application/container/server.instance";
import { updateSharedAppSettings } from "@/core/application/system-settings/updateSharedAppSettings";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { sharedSettingsSchema } from "./schemas";

export const handlers = {
  updateSharedSettings: defineHandler({
    schema: sharedSettingsSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        updateSharedAppSettings({
          container,
          headers: args.request.headers,
          input: { prohibitEveryoneAdmin: value.prohibitEveryoneAdmin },
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
