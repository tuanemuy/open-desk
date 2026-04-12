import { container } from "@/core/application/container/server.instance";
import { updateJsCssCustomization } from "@/core/application/system-settings/updateJsCssCustomization";
import type { CustomFile } from "@/core/domain/system-settings/valueObject";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { customizeSchema } from "./schemas";

const SCOPE_MAP_TO_BACKEND = {
  all: "ALL_USERS",
  admin: "ADMIN_ONLY",
  none: "DISABLED",
} as const;

export const handlers = {
  updateCustomize: defineHandler({
    schema: customizeSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      const parseFiles = (raw: string | undefined): CustomFile[] => {
        if (!raw) return [];
        try {
          const parsed: unknown = JSON.parse(raw);
          if (!Array.isArray(parsed)) return [];
          return parsed as CustomFile[];
        } catch {
          return [];
        }
      };

      return handleUseCase(() =>
        updateJsCssCustomization({
          container,
          headers: args.request.headers,
          input: {
            scope: SCOPE_MAP_TO_BACKEND[value.scope],
            pcJsFiles: parseFiles(value.pcJsFiles),
            mobileJsFiles: parseFiles(value.mobileJsFiles),
            pcCssFiles: parseFiles(value.pcCssFiles),
            mobileCssFiles: parseFiles(value.mobileCssFiles),
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
