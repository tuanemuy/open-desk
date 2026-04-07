import { z } from "zod";
import {
  createCompositeAction,
  defineHandler,
  success,
} from "@/lib/compositeAction";
import type { Route } from "./+types/index";

const createRecordSchema = z.object({
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

export const handlers = {
  createRecord: defineHandler({
    schema: createRecordSchema,
    handler: async (_value, _args) => {
      return success({ recordId: "new-record-id" });
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
