import { z } from "zod";

export const updateOptionsSchema = z.object({
  channel: z.enum(["latest", "monthly"]),
});
