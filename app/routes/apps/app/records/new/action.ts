import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { createRecord } from "@/core/application/record/createRecord";
import type { FieldValue } from "@/core/domain/record/valueObject";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
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
    handler: async (value, args) => {
      let auth: Awaited<ReturnType<typeof requireAuth>>;
      try {
        auth = await requireAuth(args.request, container);
      } catch {
        return error({ "": ["Authentication required"] });
      }

      const appId = args.params.appId as string;
      const fieldValues = new Map<string, FieldValue>();

      if (value.company) {
        fieldValues.set("company", {
          type: "SINGLE_LINE_TEXT",
          value: value.company,
        });
      }
      if (value.department) {
        fieldValues.set("department", {
          type: "SINGLE_LINE_TEXT",
          value: value.department,
        });
      }
      if (value.person) {
        fieldValues.set("person", {
          type: "SINGLE_LINE_TEXT",
          value: value.person,
        });
      }
      if (value.postalCode) {
        fieldValues.set("postal_code", {
          type: "SINGLE_LINE_TEXT",
          value: value.postalCode,
        });
      }
      if (value.tel) {
        fieldValues.set("tel", {
          type: "SINGLE_LINE_TEXT",
          value: value.tel,
        });
      }
      if (value.fax) {
        fieldValues.set("fax", {
          type: "SINGLE_LINE_TEXT",
          value: value.fax,
        });
      }
      if (value.address) {
        fieldValues.set("address", {
          type: "SINGLE_LINE_TEXT",
          value: value.address,
        });
      }
      if (value.rank) {
        fieldValues.set("rank", {
          type: "DROP_DOWN",
          value: value.rank,
        });
      }
      if (value.email) {
        fieldValues.set("email", {
          type: "LINK",
          value: value.email,
        });
      }
      if (value.notes) {
        fieldValues.set("notes", {
          type: "MULTI_LINE_TEXT",
          value: value.notes,
        });
      }

      return handleUseCase(() =>
        createRecord({
          container,
          headers: args.request.headers,
          input: {
            appId,
            fieldValues,
            creatorId: auth.userId as string,
          },
        }),
      ).match(
        (result) => success({ recordId: result.recordId as string }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
