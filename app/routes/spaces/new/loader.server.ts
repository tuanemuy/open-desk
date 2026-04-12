import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type NewSpaceLoaderData = {
  isGuest: boolean;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<NewSpaceLoaderData> {
  await requireAuth(request, container);

  const url = new URL(request.url);
  const isGuest = url.searchParams.get("guest") === "true";

  return { isGuest };
}
