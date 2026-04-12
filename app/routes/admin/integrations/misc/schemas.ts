import { z } from "zod";

export const saveMiscSchema = z.object({
  iframeEnabled: z.string().optional(),
  referrerPolicyEnabled: z.string().optional(),
  webhookEnabled: z.string().optional(),
});
