import type { FilterCondEvaluator } from "@/core/domain/access-control/ports/filterCondEvaluator";
import type { AppCreationService } from "@/core/domain/app/services/appCreationService";
import type { AppDeploymentService } from "@/core/domain/app/services/appDeploymentService";
import type { FileStorageProvider } from "@/core/domain/file/ports/fileStorageProvider";
import type { AuthenticationProvider } from "@/core/domain/identity/ports/authenticationProvider";
import type { BearerTokenHasher } from "@/core/domain/identity/ports/bearerTokenHasher";
import type { PasswordHasher } from "@/core/domain/identity/ports/passwordHasher";
import type { DesktopNotificationPublisher } from "@/core/domain/notification/ports/desktopNotificationPublisher";
import type { EmailNotificationSender } from "@/core/domain/notification/ports/emailNotificationSender";
import type { NotificationSourceResolver } from "@/core/domain/notification/ports/notificationSourceResolver";
import type { CsvImportService } from "@/core/domain/record/services/csvImportService";
import type { ProcessExecutionService } from "@/core/domain/record/services/processExecutionService";
import type { RecordQueryService } from "@/core/domain/record/services/recordQueryService";
import type { RecordValidationService } from "@/core/domain/record/services/recordValidationService";
import type { SearchIndexProvider } from "@/core/domain/search/ports/searchIndexProvider";
import type { UnitOfWorkProvider } from "../unitOfWork";

/**
 * Feature flags for enabling/disabling major features.
 */
export type FeatureConfig = {
  /** Whether the People and Message features are enabled. */
  peopleAndMessageEnabled: boolean;
};

/**
 * Application Configuration
 */
export type AppConfig = {
  appUrl: string;
  sessionTimeoutHours: number;
  maxSessionsPerUser: number;
  features: FeatureConfig;
};

/**
 * Dependency Injection Container
 */
export type Container = {
  config: AppConfig;
  unitOfWorkProvider: UnitOfWorkProvider;
  passwordHasher: PasswordHasher;
  bearerTokenHasher: BearerTokenHasher;
  authenticationProvider: AuthenticationProvider;
  fileStorageProvider: FileStorageProvider;
  searchIndexProvider: SearchIndexProvider;
  recordValidationService: RecordValidationService;
  processExecutionService: ProcessExecutionService;
  recordQueryService: RecordQueryService;
  csvImportService: CsvImportService;
  filterCondEvaluator: FilterCondEvaluator;
  emailNotificationSender: EmailNotificationSender;
  desktopNotificationPublisher: DesktopNotificationPublisher;
  notificationSourceResolver: NotificationSourceResolver;
  appCreationService: AppCreationService;
  appDeploymentService: AppDeploymentService;
};
