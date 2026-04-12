import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { updateProvisioningConfig } from "@/core/application/identity/updateProvisioningConfig";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const updateProvisioningSchema = z.object({
  isEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  regenerateToken: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export const handlers = {
  updateProvisioning: defineHandler({
    schema: updateProvisioningSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateProvisioningConfig({
          container,
          headers: args.request.headers,
          input: {
            isEnabled: value.isEnabled,
            regenerateToken: value.regenerateToken,
          },
        }),
      ).match(
        (result) => success({ config: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
