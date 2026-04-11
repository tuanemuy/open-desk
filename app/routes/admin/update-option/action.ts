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

const saveSchema = z.object({
  channel: z.enum(["LATEST", "MONTHLY"]),
  disabledFeatures: z.string().optional().default("[]"),
  disabledLatestOnlyFeatures: z.string().optional().default("[]"),
  earlyAccessFeatures: z.string().optional().default("[]"),
  experimentalFeatures: z.string().optional().default("[]"),
  apiLabFeatures: z.string().optional().default("[]"),
});

export const handlers = {
  save: defineHandler({
    schema: saveSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateUpdateOption({
          container,
          headers: args.request.headers,
          input: {
            channel: value.channel,
            disabledFeatures: JSON.parse(value.disabledFeatures),
            disabledLatestOnlyFeatures: JSON.parse(
              value.disabledLatestOnlyFeatures,
            ),
            earlyAccessFeatures: JSON.parse(value.earlyAccessFeatures),
            experimentalFeatures: JSON.parse(value.experimentalFeatures),
            apiLabFeatures: JSON.parse(value.apiLabFeatures),
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
