import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import type { SpaceUsageDto } from "@/core/application/space/dto";
import { listSpaceUsage } from "@/core/application/space/listSpaceUsage";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type SpaceLicenseInfo = {
  label: string;
  current: number;
  limit: number;
};

export type SpacesLoaderData = {
  licenses: SpaceLicenseInfo[];
  spaces: readonly SpaceUsageDto[];
  totalCount: number;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<SpacesLoaderData> {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listSpaceUsage({
      container,
      headers: request.headers,
      input: { operatorId: auth.userId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const spaceCount = result.spaces.filter((s) => !s.isGuest).length;
  const guestSpaceCount = result.spaces.filter((s) => s.isGuest).length;

  return {
    licenses: [
      { label: "スペース数", current: spaceCount, limit: 500 },
      { label: "ゲストスペース数", current: guestSpaceCount, limit: 500 },
    ],
    spaces: result.spaces,
    totalCount: result.totalCount,
  };
}
