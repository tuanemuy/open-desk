import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type HeaderColorLoaderData = {
  currentColor: string;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<HeaderColorLoaderData> {
  await requireAuth(request, container);

  return {
    currentColor: "#ffcc00",
  };
}
