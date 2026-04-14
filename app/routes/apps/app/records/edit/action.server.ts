import { container } from "@/core/application/container/server.instance";
import { updateRecord } from "@/core/application/record/updateRecord";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import { toUpdateRecordFieldValues } from "../form";
import type { Route } from "./+types/index";
import { updateRecordSchema } from "./schemas";

export const handlers = {
  updateRecord: defineHandler({
    schema: updateRecordSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      const appId = args.params.appId as string;
      const recordId = args.params.recordId as string;

      return handleUseCase(() =>
        updateRecord({
          container,
          headers: args.request.headers,
          input: {
            appId,
            recordId,
            fieldValues: toUpdateRecordFieldValues(value),
            revision: value.revision,
            modifierId: auth.userId as string,
          },
        }),
      ).match(
        () => success({ recordId }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
