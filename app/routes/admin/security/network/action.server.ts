import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { updateAccessRestriction } from "@/core/application/system-settings/updateAccessRestriction";
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
  ipRestriction: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  ipAllowList: z.string().optional().default(""),
  basicAuth: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  basicAuthUsername: z.string().optional().nullable(),
  basicAuthPassword: z.string().optional().nullable(),
});

export const handlers = {
  save: defineHandler({
    schema: saveSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      const allowedIps = value.ipAllowList
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((cidr) => ({ cidr, description: "" }));

      return handleUseCase(() =>
        updateAccessRestriction({
          container,
          headers: args.request.headers,
          input: {
            ipRestrictionEnabled: value.ipRestriction,
            allowedIps,
            basicAuthEnabled: value.basicAuth,
            basicAuthUsername: value.basicAuthUsername ?? null,
            basicAuthPassword: value.basicAuthPassword ?? null,
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
