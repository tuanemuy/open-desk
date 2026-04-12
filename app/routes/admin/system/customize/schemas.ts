import { z } from "zod";

export const customizeSchema = z.object({
  scope: z.enum(["all", "admin", "none"]),
  pcJsFiles: z.string().optional(),
  mobileJsFiles: z.string().optional(),
  pcCssFiles: z.string().optional(),
  mobileCssFiles: z.string().optional(),
});
