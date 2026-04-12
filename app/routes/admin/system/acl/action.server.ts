import { z } from "zod";
import { addSystemPermission } from "@/core/application/access-control/addSystemPermission";
import { deleteSystemPermission } from "@/core/application/access-control/deleteSystemPermission";
import { updateSystemPermission } from "@/core/application/access-control/updateSystemPermission";
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

const addPermissionSchema = z.object({
  entityType: z.enum(["USER", "GROUP", "ORGANIZATION"]),
  entityCode: z.string().min(1, "コードを入力してください"),
  includeSubs: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  systemAdmin: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  appGroupViewable: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  appGroupManageable: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  appCreate: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  appManage: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  spaceCreate: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  guestSpaceCreate: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const updatePermissionSchema = z.object({
  systemPermissionId: z.string().min(1),
  systemAdmin: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  appGroupViewable: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  appGroupManageable: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  appCreate: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  appManage: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  spaceCreate: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  guestSpaceCreate: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  includeSubs: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const deletePermissionSchema = z.object({
  systemPermissionId: z.string().min(1),
});

export const handlers = {
  addPermission: defineHandler({
    schema: addPermissionSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);
      const entity = {
        type: value.entityType,
        code: value.entityCode,
      } as const;

      return handleUseCase(() =>
        addSystemPermission({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            entity,
            includeSubs: value.includeSubs,
            systemAdmin: value.systemAdmin,
            appGroupViewable: value.appGroupViewable,
            appGroupManageable: value.appGroupManageable,
            appCreate: value.appCreate,
            appManage: value.appManage,
            spaceCreate: value.spaceCreate,
            guestSpaceCreate: value.guestSpaceCreate,
          },
        }),
      ).match(
        (result) => success({ permission: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  updatePermission: defineHandler({
    schema: updatePermissionSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateSystemPermission({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            systemPermissionId: value.systemPermissionId,
            systemAdmin: value.systemAdmin,
            appGroupViewable: value.appGroupViewable,
            appGroupManageable: value.appGroupManageable,
            appCreate: value.appCreate,
            appManage: value.appManage,
            spaceCreate: value.spaceCreate,
            guestSpaceCreate: value.guestSpaceCreate,
          },
        }),
      ).match(
        (result) => success({ permission: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  deletePermission: defineHandler({
    schema: deletePermissionSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        deleteSystemPermission({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            systemPermissionId: value.systemPermissionId,
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
