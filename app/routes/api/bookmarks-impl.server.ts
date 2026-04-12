import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { createBookmark } from "@/core/application/bookmark/createBookmark";
import { deleteBookmark } from "@/core/application/bookmark/deleteBookmark";
import { listBookmarksByCategory } from "@/core/application/bookmark/listBookmarksByCategory";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listBookmarksByCategory({
      container,
      headers: request.headers,
      input: { userId: auth.userId },
    }),
  ).match(
    (data) => data,
    (e) => {
      throw new Response(e.message, { status: e.status });
    },
  );

  return result;
}

const createBookmarkSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  url: z.string().min(1, "URLを入力してください"),
});

const deleteBookmarkSchema = z.object({
  bookmarkId: z.string().min(1, "ブックマークIDが必要です"),
});

export const handlers = {
  create: defineHandler({
    schema: createBookmarkSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);
      return handleUseCase(() =>
        createBookmark({
          container,
          headers: args.request.headers,
          input: {
            userId: auth.userId,
            name: value.name,
            url: value.url,
          },
        }),
      ).match(
        (result) => success({ bookmark: result }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  delete: defineHandler({
    schema: deleteBookmarkSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);
      return handleUseCase(() =>
        deleteBookmark({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId,
            bookmarkId: value.bookmarkId,
          },
        }),
      ).match(
        (result) => success({ bookmarkId: result.bookmarkId }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: ActionFunctionArgs) {
  return createCompositeAction(args, handlers);
}
