import { z } from "zod";

export const updateFeaturesSchema = z.object({
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
