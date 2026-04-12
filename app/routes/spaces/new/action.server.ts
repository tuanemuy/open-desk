import { container } from "@/core/application/container/server.instance";
import { createGuestSpace } from "@/core/application/space/createGuestSpace";
import { createSpace } from "@/core/application/space/createSpace";
import {
  AppCreationPermission,
  CoverImage,
  MemberEntity,
  MemberEntityType,
} from "@/core/domain/space/valueObject";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import { createSpaceSchema } from "./schemas";

export const handlers = {
  createSpace: defineHandler({
    schema: createSpaceSchema,
    handler: async (value, args) => {
      let auth: Awaited<ReturnType<typeof requireAuth>>;
      try {
        auth = await requireAuth(args.request, container);
      } catch {
        return error({ "": ["Authentication required"] });
      }

      const isGuest =
        new URL(args.request.url).searchParams.get("guest") === "true";

      const member = MemberEntity.create({
        type: MemberEntityType.User,
        id: auth.userId,
        code: auth.user.loginName as string,
      });

      const members = [
        { entity: member, isAdmin: true, includeSubs: false },
      ] as const;

      if (isGuest) {
        return handleUseCase(() =>
          createGuestSpace({
            container,
            headers: args.request.headers,
            input: {
              operatorId: auth.userId as string,
              name: value.name,
              useMultiThread: value.useMultiThread,
              fixedMember: value.fixedMember,
              appCreationPermission: AppCreationPermission.Everyone,
              coverImage: CoverImage.default(),
              members,
            },
          }),
        ).match(
          (result) => success({ spaceId: result.spaceId as string }),
          (e) => error({ "": [e.message] }),
        );
      }

      return handleUseCase(() =>
        createSpace({
          container,
          headers: args.request.headers,
          input: {
            operatorId: auth.userId as string,
            name: value.name,
            isPrivate: value.isPrivate,
            useMultiThread: value.useMultiThread,
            fixedMember: value.fixedMember,
            appCreationPermission: AppCreationPermission.Everyone,
            coverImage: CoverImage.default(),
            members,
          },
        }),
      ).match(
        (result) => success({ spaceId: result.spaceId as string }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}
