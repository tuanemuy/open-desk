import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { updateOAuthIntegration } from "@/core/application/system-settings/updateOAuthIntegration";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const toggleIntegrationSchema = z.object({
  integrationId: z.string().min(1),
  enabled: z.string(),
});

export const handlers = {
  toggleIntegration: defineHandler({
    schema: toggleIntegrationSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateOAuthIntegration({
          container,
          headers: args.request.headers,
          input: {
            integrationId: value.integrationId,
            enabled: value.enabled === "true",
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
