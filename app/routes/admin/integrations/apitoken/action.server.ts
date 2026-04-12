import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { issueApiToken } from "@/core/application/identity/issueApiToken";
import { revokeApiToken } from "@/core/application/identity/revokeApiToken";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

const issueTokenSchema = z.object({
  summary: z.string().min(1, "概要を入力してください"),
  scopes: z
    .string()
    .min(1, "スコープを選択してください")
    .transform((v) => v.split(",")),
});

const revokeTokenSchema = z.object({
  tokenId: z.string().min(1, "トークンIDを指定してください"),
});

export const handlers = {
  issueToken: defineHandler({
    schema: issueTokenSchema,
    handler: async (value, args) => {
      const auth = await requireAuth(args.request, container);

      return handleUseCase(() =>
        issueApiToken({
          container,
          headers: args.request.headers,
          input: {
            userId: auth.userId,
            scopes: value.scopes,
            summary: value.summary,
          },
        }),
      ).match(
        (result) =>
          success({
            id: result.id,
            token: result.token,
            summary: result.summary,
            scopes: result.scopes,
          }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  revokeToken: defineHandler({
    schema: revokeTokenSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        revokeApiToken({
          container,
          headers: args.request.headers,
          input: {
            tokenId: value.tokenId,
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
