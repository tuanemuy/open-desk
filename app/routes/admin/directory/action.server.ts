import { container } from "@/core/application/container/server.instance";
import { activateUser } from "@/core/application/identity/activateUser";
import {
  type CreateOrganizationInput,
  createOrganization,
} from "@/core/application/identity/createOrganization";
import { createUser } from "@/core/application/identity/createUser";
import { deactivateUser } from "@/core/application/identity/deactivateUser";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import {
  createOrgSchema,
  createUserSchema,
  toggleUserStatusSchema,
} from "./schemas";

export const handlers = {
  createUser: defineHandler({
    schema: createUserSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      return handleUseCase(() =>
        createUser({
          container,
          headers: args.request.headers,
          input: value,
        }),
      ).match(
        (result) => success({ userId: result.userId }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  createOrganization: defineHandler({
    schema: createOrgSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      const input: CreateOrganizationInput = {
        name: value.name,
        code: value.code,
        parentOrganizationId: value.parentOrganizationId || undefined,
      };
      return handleUseCase(() =>
        createOrganization({
          container,
          headers: args.request.headers,
          input,
        }),
      ).match(
        (result) => success({ organizationId: result.organizationId }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
  toggleUserStatus: defineHandler({
    schema: toggleUserStatusSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      const fn = value.action === "activate" ? activateUser : deactivateUser;
      return handleUseCase(() =>
        fn({
          container,
          headers: args.request.headers,
          input: { userId: value.userId },
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
