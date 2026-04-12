import { z } from "zod";

export const addPermissionSchema = z.object({
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

export const updatePermissionSchema = z.object({
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

export const deletePermissionSchema = z.object({
  systemPermissionId: z.string().min(1),
});
