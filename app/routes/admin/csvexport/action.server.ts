import { container } from "@/core/application/container/server.instance";
import { csvExportGroups } from "@/core/application/identity/csvExportGroups";
import { csvExportOrganizations } from "@/core/application/identity/csvExportOrganizations";
import { csvExportUsers } from "@/core/application/identity/csvExportUsers";
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
  exportCsv: defineHandler({
    handler: async (formData, args) => {
      await requireAuth(args.request, container);

      const exportType = formData.get("exportType");

      if (typeof exportType !== "string" || exportType === "") {
        return error({ "": ["書き出し対象を選択してください"] });
      }

      if (exportType === "users") {
        return handleUseCase(() =>
          csvExportUsers({
            container,
            headers: args.request.headers,
            input: { encoding: "utf-8" },
          }),
        ).match(
          (result) =>
            success({
              csvContent: result.csvContent,
              fileName: result.fileName,
              totalCount: result.totalCount,
            }),
          (e) => error({ "": [e.message] }),
        );
      }

      if (exportType === "organizations") {
        return handleUseCase(() =>
          csvExportOrganizations({
            container,
            headers: args.request.headers,
            input: { encoding: "utf-8" },
          }),
        ).match(
          (result) =>
            success({
              csvContent: result.csvContent,
              fileName: result.fileName,
              totalCount: result.totalCount,
            }),
          (e) => error({ "": [e.message] }),
        );
      }

      if (exportType === "groups") {
        return handleUseCase(() =>
          csvExportGroups({
            container,
            headers: args.request.headers,
            input: { encoding: "utf-8" },
          }),
        ).match(
          (result) =>
            success({
              csvContent: result.csvContent,
              fileName: result.fileName,
              totalCount: result.totalCount,
            }),
          (e) => error({ "": [e.message] }),
        );
      }

      return error({ "": ["不正な書き出し対象です"] });
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
