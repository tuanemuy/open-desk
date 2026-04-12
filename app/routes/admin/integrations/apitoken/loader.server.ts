import { container } from "@/core/application/container/server.instance";
import { listApiTokens } from "@/core/application/identity/listApiTokens";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type ApiTokenItem = {
  id: string;
  summary: string;
  scopes: string[];
  userId: string;
  createdAt: string;
  expiresAt: string | null;
  isRevoked: boolean;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const result = await listApiTokens({
    container,
    headers: request.headers,
    input: {
      offset: 0,
      limit: 100,
    },
  });

  const tokens: ApiTokenItem[] = result.tokens.map((t) => ({
    id: t.id,
    summary: t.summary,
    scopes: t.scopes,
    userId: t.userId,
    createdAt: t.createdAt.toISOString(),
    expiresAt: t.expiresAt ? t.expiresAt.toISOString() : null,
    isRevoked: t.isRevoked,
  }));

  return { tokens };
}
