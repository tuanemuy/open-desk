import { z } from "zod";

export const createSpaceSchema = z.object({
  name: z.string().min(1).max(128),
  isPrivate: z.coerce.boolean().default(false),
  useMultiThread: z.coerce.boolean().default(false),
  fixedMember: z.coerce.boolean().default(false),
  isGuest: z.coerce.boolean().default(false),
});
