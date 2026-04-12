import { z } from "zod";

export const sharedSettingsSchema = z.object({
  prohibitEveryoneAdmin: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
