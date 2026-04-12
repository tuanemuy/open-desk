import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { updateFeatureFlags } from "@/core/application/system-settings/updateFeatureFlags";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const updateFeaturesSchema = z.object({
  emailEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  emailDefaultReceive: z.enum(["self", "none"]),
  emailFormat: z.enum(["html", "text"]),
  emailPersonalChange: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  emailApiNotify: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  spaceEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  spaceStandaloneApp: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  guestSpaceEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  peopleMessageEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  dashboardEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export const handlers = {
  updateFeatures: defineHandler({
    schema: updateFeaturesSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        updateFeatureFlags({
          container,
          headers: args.request.headers,
          input: {
            emailNotification: {
              enabled: value.emailEnabled,
              defaultReceive:
                value.emailDefaultReceive === "self" ? "SELF_ONLY" : "NONE",
              format: value.emailFormat === "html" ? "HTML" : "TEXT",
              allowUserFormatChange: value.emailPersonalChange,
              notifyRestApi: value.emailApiNotify,
            },
            space: {
              enabled: value.spaceEnabled,
              allowStandaloneApp: value.spaceStandaloneApp,
            },
            guestSpace: {
              enabled: value.guestSpaceEnabled,
            },
            peopleAndMessage: {
              enabled: value.peopleMessageEnabled,
            },
            usageDashboard: {
              enabled: value.dashboardEnabled,
            },
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
