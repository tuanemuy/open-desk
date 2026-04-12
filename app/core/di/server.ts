/**
 * Server-side DI Container
 *
 * This file provides the concrete implementation of the server container
 * with all necessary adapters for server-side operations.
 */

import { join } from "node:path";
import { AuthenticationProviderImpl } from "@/core/adapters/auth/authenticationProvider";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { ScryptBearerTokenHasher } from "@/core/adapters/drizzleSqlite/repositories/bearerTokenHasher";
import { ScryptPasswordHasher } from "@/core/adapters/drizzleSqlite/repositories/passwordHasher";
import { DrizzleSqliteAppCreationService } from "@/core/adapters/drizzleSqlite/services/appCreationService";
import { DrizzleSqliteAppDeploymentService } from "@/core/adapters/drizzleSqlite/services/appDeploymentService";
import { DrizzleSqliteCsvImportService } from "@/core/adapters/drizzleSqlite/services/csvImportService";
import { DrizzleSqliteFilterCondEvaluator } from "@/core/adapters/drizzleSqlite/services/filterCondEvaluator";
import { DrizzleSqliteNotificationSourceResolver } from "@/core/adapters/drizzleSqlite/services/notificationSourceResolver";
import { DrizzleSqliteProcessExecutionService } from "@/core/adapters/drizzleSqlite/services/processExecutionService";
import { DrizzleSqliteRecordQueryService } from "@/core/adapters/drizzleSqlite/services/recordQueryService";
import { DrizzleSqliteRecordValidationService } from "@/core/adapters/drizzleSqlite/services/recordValidationService";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import { LocalFileStorageProvider } from "@/core/adapters/localStorage/fileStorageProvider";
import type { MeilisearchConfig } from "@/core/adapters/meilisearch/searchIndexProvider";
import { MeilisearchSearchIndexProvider } from "@/core/adapters/meilisearch/searchIndexProvider";
import type { R2Config } from "@/core/adapters/r2/fileStorageProvider";
import { R2FileStorageProvider } from "@/core/adapters/r2/fileStorageProvider";
import type { SmtpConfig } from "@/core/adapters/smtp/emailNotificationSender";
import { SmtpEmailNotificationSender } from "@/core/adapters/smtp/emailNotificationSender";
import { StubDesktopNotificationPublisher } from "@/core/adapters/stub/desktopNotificationPublisher";
import { StubEmailNotificationSender } from "@/core/adapters/stub/emailNotificationSender";
import { StubSearchIndexProvider } from "@/core/adapters/stub/searchIndexProvider";
import {
  type VapidConfig,
  WebPushDesktopNotificationPublisher,
} from "@/core/adapters/webpush/desktopNotificationPublisher";
import type { Container } from "@/core/application/container/server";
import type { FileStorageProvider } from "@/core/domain/file/ports/fileStorageProvider";

/**
 * Server configuration type
 */
export type ServerConfig = {
  databaseUrl: string;
  appUrl: string;
  sessionTimeoutHours: number;
  maxSessionsPerUser: number;
  smtp: SmtpConfig | null;
  r2: R2Config | null;
  vapid: VapidConfig | null;
  meilisearch: MeilisearchConfig | null;
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

  const smtpHost = process.env.SMTP_HOST;
  const smtp: SmtpConfig | null = smtpHost
    ? {
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? "587"),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER ?? "",
        password: process.env.SMTP_PASSWORD ?? "",
        from: process.env.SMTP_FROM ?? "noreply@example.com",
      }
    : null;

  const r2AccountId = process.env.R2_ACCOUNT_ID;
  const r2: R2Config | null = r2AccountId
    ? {
        accountId: r2AccountId,
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
        bucketName: process.env.R2_BUCKET_NAME ?? "",
        publicUrl: process.env.R2_PUBLIC_URL ?? "",
      }
    : null;

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapid: VapidConfig | null = vapidPublicKey
    ? {
        publicKey: vapidPublicKey,
        privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
        subject: process.env.VAPID_SUBJECT ?? "",
      }
    : null;

  const meiliHost = process.env.MEILI_HOST;
  const meilisearch: MeilisearchConfig | null = meiliHost
    ? {
        host: meiliHost,
        apiKey: process.env.MEILI_API_KEY ?? "",
      }
    : null;

  return {
    databaseUrl,
    appUrl,
    sessionTimeoutHours: Number(process.env.SESSION_TIMEOUT_HOURS ?? "24"),
    maxSessionsPerUser: Number(process.env.MAX_SESSIONS_PER_USER ?? "3"),
    smtp,
    r2,
    vapid,
    meilisearch,
  };
}

/**
 * Create a DI container with the given configuration
 */
export function createContainer(config: ServerConfig): Container {
  const db = getDatabase(config.databaseUrl);
  const unitOfWorkProvider = new DrizzleSqliteUnitOfWorkProvider(db);

  const fileStorageProvider: FileStorageProvider = config.r2
    ? new R2FileStorageProvider(config.r2)
    : new LocalFileStorageProvider({
        basePath: join(process.cwd(), ".storage"),
      });

  const bearerTokenHasher = new ScryptBearerTokenHasher();

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
    bearerTokenHasher,
    authenticationProvider: new AuthenticationProviderImpl(
      db,
      bearerTokenHasher,
    ),
    fileStorageProvider,
    searchIndexProvider: config.meilisearch
      ? new MeilisearchSearchIndexProvider(config.meilisearch)
      : new StubSearchIndexProvider(),
    recordValidationService: new DrizzleSqliteRecordValidationService(db),
    processExecutionService: new DrizzleSqliteProcessExecutionService(db),
    recordQueryService: new DrizzleSqliteRecordQueryService(),
    csvImportService: new DrizzleSqliteCsvImportService(db),
    filterCondEvaluator: new DrizzleSqliteFilterCondEvaluator(),
    emailNotificationSender: config.smtp
      ? new SmtpEmailNotificationSender(config.smtp)
      : new StubEmailNotificationSender(),
    desktopNotificationPublisher: config.vapid
      ? new WebPushDesktopNotificationPublisher(config.vapid, db)
      : new StubDesktopNotificationPublisher(),
    notificationSourceResolver: new DrizzleSqliteNotificationSourceResolver(db),
    appCreationService: new DrizzleSqliteAppCreationService(db),
    appDeploymentService: new DrizzleSqliteAppDeploymentService(db),
  };
}

export const container = createContainer(getServerConfig());
