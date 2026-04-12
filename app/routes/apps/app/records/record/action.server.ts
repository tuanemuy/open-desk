import { container } from "@/core/application/container/server.instance";
import { postComment } from "@/core/application/record/postComment";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { addCommentSchema } from "./schemas";

export const handlers = {
  addComment: defineHandler({
    schema: addCommentSchema,
    handler: async (value, args) => {
      let auth: Awaited<ReturnType<typeof requireAuth>>;
      try {
        auth = await requireAuth(args.request, container);
      } catch {
        return error({ "": ["Authentication required"] });
      }

      const appId = args.params.appId as string;
      const recordId = args.params.recordId as string;

      return handleUseCase(() =>
        postComment({
          container,
          headers: args.request.headers,
          input: {
            appId,
            recordId,
            text: value.comment,
            creatorId: auth.userId as string,
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
