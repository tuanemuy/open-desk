import { z } from "zod";

export const createAppBlankSchema = z.object({
  name: z.string().default("New App"),
});
