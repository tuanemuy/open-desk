import { z } from "zod";

export const createAppBlankSchema = z.object({
  name: z.string().min(1).max(64).default("New App"),
});
