import { container } from "@/core/application/container/server.instance";
import { updateUserProfile } from "@/core/application/identity/updateUserProfile";
import {
  createCompositeAction,
  defineHandler,
  success,
} from "@/lib/compositeAction";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { updateTimeFormatSchema } from "./schemas";

export const handlers = {
  updateTimeFormat: defineHandler({
    schema: updateTimeFormatSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      await updateUserProfile({
        container,
        headers: args.request.headers,
        input: {
          userId: auth.userId,
          displayName: auth.user.displayName,
          timezone: auth.user.timezone,
          language: auth.user.language,
          timeFormat: value.timeFormat,
        },
      });

      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
