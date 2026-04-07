import { redirect } from "react-router";
import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import { login } from "@/core/application/identity/login";
import {
  createCompositeAction,
  defineHandler,
  error,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { createSessionCookie } from "@/lib/session.server";
import type { Route } from "./+types/index";

const loginSchema = z.object({
  loginName: z.string().min(1, "Please enter your email address"),
  password: z.string().min(1, "Please enter your password"),
});

export const handlers = {
  login: defineHandler({
    schema: loginSchema,
    handler: async (value, args) => {
      const headers = args.request.headers;
      const ipAddress =
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headers.get("x-real-ip") ??
        "unknown";
      const userAgent = headers.get("user-agent") ?? "unknown";

      return handleUseCase(() =>
        login({
          container,
          headers,
          input: {
            loginName: value.loginName,
            password: value.password,
            ipAddress,
            userAgent,
          },
        }),
      ).match(
        (result) => {
          throw redirect("/portal", {
            headers: {
              "Set-Cookie": createSessionCookie(
                result.sessionId,
                result.expiresAt,
              ),
            },
          });
        },
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
