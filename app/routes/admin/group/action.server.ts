import { container } from "@/core/application/container/server.instance";
import { createGroup } from "@/core/application/identity/createGroup";
import { deleteGroup } from "@/core/application/identity/deleteGroup";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { createGroupSchema, deleteGroupSchema } from "./schemas";

export const handlers = {
  createGroup: defineHandler({
    schema: createGroupSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        createGroup({
          container,
          headers: args.request.headers,
          input: value,
        }),
      ).match(
        (result) => success({ groupId: result.groupId }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteGroup: defineHandler({
    schema: deleteGroupSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        deleteGroup({
          container,
          headers: args.request.headers,
          input: { groupId: value.groupId },
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
