import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { updateLoginPage } from "@/core/application/system-settings/updateLoginPage";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const updateLoginSettingSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  backgroundImageFileId: z.string().optional().nullable(),
});

export const handlers = {
  updateLoginSetting: defineHandler({
    schema: updateLoginSettingSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateLoginPage({
          container,
          headers: args.request.headers,
          input: {
            title: value.title,
            backgroundImageFileId: value.backgroundImageFileId ?? null,
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
