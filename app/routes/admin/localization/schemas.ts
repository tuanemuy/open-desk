import { z } from "zod";

export const saveLocaleSchema = z.object({
  timezone: z.string().min(1),
  language: z.string().min(1),
});
