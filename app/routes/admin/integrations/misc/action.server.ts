import { container } from "@/core/application/container/server.instance";
import { updateExternalIntegration } from "@/core/application/system-settings/updateExternalIntegration";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { saveMiscSchema } from "./schemas";

export const handlers = {
  saveMisc: defineHandler({
    schema: saveMiscSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateExternalIntegration({
          container,
          headers: args.request.headers,
          input: {
            allowIframe: value.iframeEnabled === "true",
            referrerPolicySameOrigin: value.referrerPolicyEnabled === "true",
            allowWebhook: value.webhookEnabled === "true",
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
