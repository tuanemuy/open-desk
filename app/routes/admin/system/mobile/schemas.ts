import { z } from "zod";

export const mobileSchema = z.object({
  displayMode: z.enum(["mobile", "pc"]),
  allowUserSwitch: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
