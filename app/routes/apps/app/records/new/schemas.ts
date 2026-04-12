import { z } from "zod";

export const createRecordSchema = z.object({
  company: z.string().optional(),
  department: z.string().optional(),
  person: z.string().optional(),
  postalCode: z.string().max(7, "Must be 7 characters or less").optional(),
  tel: z.string().optional(),
  fax: z.string().optional(),
  address: z.string().optional(),
  rank: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
});
