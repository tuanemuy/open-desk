import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { updateMobileDisplay } from "@/core/application/system-settings/updateMobileDisplay";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const schema = z.object({
  displayMode: z.enum(["mobile", "pc"]),
  allowUserSwitch: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export const handlers = {
  updateMobile: defineHandler({
    schema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        updateMobileDisplay({
          container,
          headers: args.request.headers,
          input: {
            displayMode: value.displayMode === "mobile" ? "MOBILE" : "PC",
            allowUserToggle: value.allowUserSwitch,
          },
        }),
      ).match(
        (result) => success({ data: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
