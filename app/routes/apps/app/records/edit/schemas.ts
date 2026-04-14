import { z } from "zod";
import { recordFormSchema } from "../form";

export const updateRecordSchema = recordFormSchema.extend({
  revision: z.coerce.number().int().nonnegative(),
});
