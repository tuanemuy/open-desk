import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { updateLogo } from "@/core/application/system-settings/updateLogo";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const updateHeaderSettingSchema = z.object({
  logoUrl: z.string().min(1, "URLを入力してください"),
  imageFileId: z.string().optional().nullable(),
});

export const handlers = {
  updateHeaderSetting: defineHandler({
    schema: updateHeaderSettingSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateLogo({
          container,
          headers: args.request.headers,
          input: {
            imageFileId: value.imageFileId ?? null,
            linkUrl: value.logoUrl,
          },
        }),
      ).match(
        () => success(),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
