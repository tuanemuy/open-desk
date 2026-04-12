import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { updateUpdateOption } from "@/core/application/system-settings/updateUpdateOption";
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
  channel: z.enum(["latest", "monthly"]),
});

export const handlers = {
  updateOptions: defineHandler({
    schema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        updateUpdateOption({
          container,
          headers: args.request.headers,
          input: {
            channel: value.channel === "latest" ? "LATEST" : "MONTHLY",
            disabledFeatures: [],
            disabledLatestOnlyFeatures: [],
            earlyAccessFeatures: [],
            experimentalFeatures: [],
            apiLabFeatures: [],
          },
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
