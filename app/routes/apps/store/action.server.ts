import { createAppBlank } from "@/core/application/app/createAppBlank";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { createAppBlankSchema } from "./schemas";

export const handlers = {
  createBlank: defineHandler({
    schema: createAppBlankSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        createAppBlank({
          container,
          headers: args.request.headers,
          input: {
            name: value.name,
            spaceId: null,
            threadId: null,
            creatorId: auth.userId as string,
          },
        }),
      ).match(
        (result) => success({ appId: result.appId as string }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
