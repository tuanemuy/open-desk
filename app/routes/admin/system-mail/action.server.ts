import { container } from "@/core/application/container/server.instance";
import { updateSystemMail } from "@/core/application/system-settings/updateSystemMail";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { updateMailSettingsSchema } from "./schemas";

export const handlers = {
  updateMailSettings: defineHandler({
    schema: updateMailSettingsSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      const externalServer =
        value.serverType === "EXTERNAL"
          ? {
              host: value.externalHost ?? "",
              port: value.externalPort ?? 587,
              username: value.externalUsername ?? "",
              passwordEncrypted: value.externalPassword ?? "",
              useTls: value.externalUseTls,
            }
          : null;

      return handleUseCase(() =>
        updateSystemMail({
          container,
          headers: args.request.headers,
          input: {
            fromAddress: value.fromAddress,
            serverType: value.serverType,
            externalServer,
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
