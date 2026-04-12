import { redirect } from "react-router";
import type { Container } from "@/core/application/container/server";
import type { User } from "@/core/domain/identity/entity";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";

const SESSION_COOKIE_NAME = "od_session";

/**
 * Parse the session ID from the request cookie header.
 */
export function getSessionId(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  return match ? match.slice(SESSION_COOKIE_NAME.length + 1) : null;
}

/**
 * Create a Set-Cookie header value to persist the session.
 */
export function createSessionCookie(
  sessionId: string,
  expiresAt: Date,
): string {
  return `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}`;
}

/**
 * Create a Set-Cookie header value to clear the session.
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export type AuthUser = {
  userId: UserIdType;
  displayName: string;
  user: User;
};

/**
 * Require an authenticated user. Redirects to /login if not authenticated.
 */
export async function requireAuth(
  request: Request,
  container: Container,
): Promise<AuthUser> {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    throw redirect("/login");
  }

  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    const session = await ctx.sessionRepository.findById(
      sessionId as import("@/core/domain/identity/valueObject").SessionId,
    );
    if (!session) return null;
    if (session.expiresAt < new Date()) return null;

    const user = await ctx.userRepository.findById(session.userId);
    if (!user || !user.isActive) return null;

    return { userId: session.userId, displayName: user.displayName, user };
  });

  if (!result) {
    throw redirect("/login");
  }

  return result;
}
