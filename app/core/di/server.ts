/**
 * Server-side DI Container
 *
 * This file provides the concrete implementation of the server container
 * with all necessary adapters for server-side operations.
 */

import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import { StubAppCreationService } from "@/core/adapters/stub/appCreationService";
import { StubAppDeploymentService } from "@/core/adapters/stub/appDeploymentService";
import { StubAuthenticationProvider } from "@/core/adapters/stub/authenticationProvider";
import { StubCsvImportService } from "@/core/adapters/stub/csvImportService";
import { StubDesktopNotificationPublisher } from "@/core/adapters/stub/desktopNotificationPublisher";
import { StubEmailNotificationSender } from "@/core/adapters/stub/emailNotificationSender";
import { StubFileStorageProvider } from "@/core/adapters/stub/fileStorageProvider";
import { StubFilterCondEvaluator } from "@/core/adapters/stub/filterCondEvaluator";
import { StubNotificationSourceResolver } from "@/core/adapters/stub/notificationSourceResolver";
import { StubProcessExecutionService } from "@/core/adapters/stub/processExecutionService";
import { StubRecordQueryService } from "@/core/adapters/stub/recordQueryService";
import { StubRecordValidationService } from "@/core/adapters/stub/recordValidationService";
import { StubSearchIndexProvider } from "@/core/adapters/stub/searchIndexProvider";
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
      features: {
        peopleAndMessageEnabled:
          process.env.PEOPLE_AND_MESSAGE_ENABLED !== "false",
      },
    },
    unitOfWorkProvider,
    passwordHasher: new ScryptPasswordHasher(),
    authenticationProvider: new StubAuthenticationProvider(),
    fileStorageProvider: new StubFileStorageProvider(),
    searchIndexProvider: new StubSearchIndexProvider(),
    recordValidationService: new StubRecordValidationService(),
    processExecutionService: new StubProcessExecutionService(),
    recordQueryService: new StubRecordQueryService(),
    csvImportService: new StubCsvImportService(),
    filterCondEvaluator: new StubFilterCondEvaluator(),
    emailNotificationSender: new StubEmailNotificationSender(),
    desktopNotificationPublisher: new StubDesktopNotificationPublisher(),
    notificationSourceResolver: new StubNotificationSourceResolver(),
    appCreationService: new StubAppCreationService(),
    appDeploymentService: new StubAppDeploymentService(),
  };
}

export const container = createContainer(getServerConfig());
