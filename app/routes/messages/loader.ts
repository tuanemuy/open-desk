import { redirect } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { listMessageThreads } from "@/core/application/message/listMessageThreads";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listMessageThreads({
      container,
      headers: request.headers,
      input: {
        operatorId: auth.userId,
        offset: 0,
        limit: 1,
      },
    }),
  ).match(
    (r) => r,
    () => null,
  );

  if (result && result.threads.length > 0) {
    throw redirect(`/messages/${result.threads[0].threadId}`);
  }

  // No threads exist; stay on /messages with the empty state UI
  return {};
}
