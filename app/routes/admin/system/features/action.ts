import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  success,
} from "@/lib/compositeAction";
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
    handler: async (_value, args) => {
      await requireAuth(args.request, container);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
