import { container } from "@/core/application/container/server.instance";
import { csvImportGroups } from "@/core/application/identity/csvImportGroups";
import { csvImportOrganizations } from "@/core/application/identity/csvImportOrganizations";
import { csvImportUsers } from "@/core/application/identity/csvImportUsers";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export const handlers = {
  importCsv: defineHandler({
    handler: async (formData, args) => {
      await requireAuth(args.request, container);

      const importType = formData.get("importType");
      const file = formData.get("csvFile");
      const hasHeaderValue = formData.get("hasHeader");

      if (typeof importType !== "string" || importType === "") {
        return error({ "": ["読み込み対象を選択してください"] });
      }

      if (!(file instanceof File) || file.size === 0) {
        return error({ "": ["CSVファイルを選択してください"] });
      }

      const csvContent = await file.text();
      const hasHeader = hasHeaderValue === "on";

      if (importType === "users") {
        return handleUseCase(() =>
          csvImportUsers({
            container,
            headers: args.request.headers,
            input: {
              csvContent,
              encoding: "utf-8",
              hasHeader,
            },
          }),
        ).match(
          (result) =>
            success({
              importedCount: result.importedCount,
              skippedCount: result.skippedCount,
              errors: result.errors,
            }),
          (e) => error({ "": [e.message] }),
        );
      }

      if (importType === "organizations") {
        return handleUseCase(() =>
          csvImportOrganizations({
            container,
            headers: args.request.headers,
            input: {
              csvContent,
              encoding: "utf-8",
              hasHeader,
            },
          }),
        ).match(
          (result) =>
            success({
              importedCount: result.importedCount,
              skippedCount: result.skippedCount,
              errors: result.errors,
            }),
          (e) => error({ "": [e.message] }),
        );
      }

      if (importType === "groups") {
        return handleUseCase(() =>
          csvImportGroups({
            container,
            headers: args.request.headers,
            input: {
              csvContent,
              encoding: "utf-8",
              hasHeader,
            },
          }),
        ).match(
          (result) =>
            success({
              importedCount: result.importedCount,
              skippedCount: result.skippedCount,
              errors: result.errors,
            }),
          (e) => error({ "": [e.message] }),
        );
      }

      return error({ "": ["不正な読み込み対象です"] });
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
