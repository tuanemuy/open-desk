import { z } from "zod";

export const updateTimeFormatSchema = z.object({
  timeFormat: z.enum(["12h", "24h"]),
});
