import { z } from "zod";
import { createOrgAccessRule } from "@/core/application/access-control/createOrgAccessRule";
import { deleteOrgAccessRule } from "@/core/application/access-control/deleteOrgAccessRule";
import { updateOrgAccessRule } from "@/core/application/access-control/updateOrgAccessRule";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const createOrgAccessRuleSchema = z.object({
  sourceOrganizationId: z.string().min(1, "送信元組織を選択してください"),
  targetOrganizationId: z.string().min(1, "送信先組織を選択してください"),
  accessLevel: z.enum(["FULL", "READ_ONLY", "NONE"]),
  isEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const updateOrgAccessRuleSchema = z.object({
  orgAccessRuleId: z.string().min(1),
  accessLevel: z.enum(["FULL", "READ_ONLY", "NONE"]).optional(),
  isEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const deleteOrgAccessRuleSchema = z.object({
  orgAccessRuleId: z.string().min(1),
});

export const handlers = {
  createOrgAccessRule: defineHandler({
    schema: createOrgAccessRuleSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        createOrgAccessRule({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            sourceOrganizationId: value.sourceOrganizationId,
            targetOrganizationId: value.targetOrganizationId,
            accessLevel: value.accessLevel,
            isEnabled: value.isEnabled,
          },
        }),
      ).match(
        (result) => success({ rule: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  updateOrgAccessRule: defineHandler({
    schema: updateOrgAccessRuleSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateOrgAccessRule({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            orgAccessRuleId: value.orgAccessRuleId,
            accessLevel: value.accessLevel,
            isEnabled: value.isEnabled,
          },
        }),
      ).match(
        (result) => success({ rule: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deleteOrgAccessRule: defineHandler({
    schema: deleteOrgAccessRuleSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        deleteOrgAccessRule({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            orgAccessRuleId: value.orgAccessRuleId,
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
