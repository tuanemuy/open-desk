import { z } from "zod";

export const guestAuthSchema = z.object({
  twoFactorEnabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
