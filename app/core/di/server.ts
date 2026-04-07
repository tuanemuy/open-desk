/**
 * Server-side DI Container
 *
 * This file provides the concrete implementation of the server container
 * with all necessary adapters for server-side operations.
 */

import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import type { Container } from "@/core/application/container/server";

/**
 * Server configuration type
 */
export type ServerConfig = {
  databaseUrl: string;
  appUrl: string;
  sessionTimeoutHours: number;
  maxSessionsPerUser: number;
};

/**
 * Read server configuration from environment variables
 */
function getServerConfig(): ServerConfig {
  const databaseUrl = process.env.SQLITE_URL;
  const appUrl = process.env.APP_URL;

  if (!databaseUrl) {
    throw new Error("SQLITE_URL environment variable is not set");
  }

  if (!appUrl) {
    throw new Error("APP_URL environment variable is not set");
  }

  return {
    databaseUrl,
    appUrl,
    sessionTimeoutHours: Number(process.env.SESSION_TIMEOUT_HOURS ?? "24"),
    maxSessionsPerUser: Number(process.env.MAX_SESSIONS_PER_USER ?? "3"),
  };
}

/**
 * Create a DI container with the given configuration
 */
export function createContainer(config: ServerConfig): Container {
  const db = getDatabase(config.databaseUrl);
  const unitOfWorkProvider = new DrizzleSqliteUnitOfWorkProvider(db);

  return {
    config: {
      appUrl: config.appUrl,
      sessionTimeoutHours: config.sessionTimeoutHours,
      maxSessionsPerUser: config.maxSessionsPerUser,
    },
    unitOfWorkProvider,
    passwordHasher: new ScryptPasswordHasher(),
  };
}

export const container = createContainer(getServerConfig());
