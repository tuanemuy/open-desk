import type {
  Repositories,
  TransactionContext,
  UnitOfWorkProvider,
} from "@/core/application/unitOfWork";
import type { Database, Executor } from "./client";
// app
import { DrizzleSqliteApiTokenConfigRepository } from "./repositories/apiTokenConfigRepository";
// identity
import { DrizzleSqliteApiTokenRecordRepository } from "./repositories/apiTokenRecordRepository";
// access-control
import { DrizzleSqliteAppAclRepository } from "./repositories/appAclRepository";
import { DrizzleSqliteAppActionRepository } from "./repositories/appActionRepository";
import { DrizzleSqliteAppCategoryRepository } from "./repositories/appCategoryRepository";
import { DrizzleSqliteAppCustomizationRepository } from "./repositories/appCustomizationRepository";
import { DrizzleSqliteAppGroupRepository } from "./repositories/appGroupRepository";
import { DrizzleSqliteAppI18nConfigRepository } from "./repositories/appI18nConfigRepository";
import { DrizzleSqliteAppNotificationConfigRepository } from "./repositories/appNotificationConfigRepository";
import { DrizzleSqliteAppRepository } from "./repositories/appRepository";
import { DrizzleSqliteAppTemplateRepository } from "./repositories/appTemplateRepository";
// audit
import { DrizzleSqliteAuditLogRepository } from "./repositories/auditLogRepository";
import { DrizzleSqliteAuditLogSettingRepository } from "./repositories/auditLogSettingRepository";
// bookmark
import { DrizzleSqliteBookmarkRepository } from "./repositories/bookmarkRepository";
// space
import { DrizzleSqliteCommentLikeRepository } from "./repositories/commentLikeRepository";
// record
import { DrizzleSqliteCsvExportJobRepository } from "./repositories/csvExportJobRepository";
import { DrizzleSqliteCsvImportJobRepository } from "./repositories/csvImportJobRepository";
// message
import { DrizzleSqliteDirectMessageRepository } from "./repositories/directMessageRepository";
import { DrizzleSqliteFieldAclRepository } from "./repositories/fieldAclRepository";
import { DrizzleSqliteFieldRepository } from "./repositories/fieldRepository";
// file
import { DrizzleSqliteFileRepository } from "./repositories/fileRepository";
// people
import { DrizzleSqliteFollowRepository } from "./repositories/followRepository";
import { DrizzleSqliteFormLayoutRepository } from "./repositories/formLayoutRepository";
import { DrizzleSqliteGroupRepository } from "./repositories/groupRepository";
import { DrizzleSqliteMembershipRepository } from "./repositories/membershipRepository";
import { DrizzleSqliteMessageThreadRepository } from "./repositories/messageThreadRepository";
// notification
import { DrizzleSqliteNotificationFilterRepository } from "./repositories/notificationFilterRepository";
import { DrizzleSqliteNotificationPreferenceRepository } from "./repositories/notificationPreferenceRepository";
import { DrizzleSqliteNotificationRepository } from "./repositories/notificationRepository";
import { DrizzleSqliteOrgAccessRuleRepository } from "./repositories/orgAccessRuleRepository";
import { DrizzleSqliteOrganizationRepository } from "./repositories/organizationRepository";
import { DrizzleSqlitePluginConfigRepository } from "./repositories/pluginConfigRepository";
import { DrizzleSqlitePluginRepository } from "./repositories/pluginRepository";
// portal
import { DrizzleSqlitePortalAnnouncementRepository } from "./repositories/portalAnnouncementRepository";
import { DrizzleSqlitePostRepository } from "./repositories/postRepository";
import { DrizzleSqliteProcessDefinitionRepository } from "./repositories/processDefinitionRepository";
import { DrizzleSqliteProfileRepository } from "./repositories/profileRepository";
import { DrizzleSqliteProvisioningConfigRepository } from "./repositories/provisioningConfigRepository";
import { DrizzleSqliteRecordAclRepository } from "./repositories/recordAclRepository";
import { DrizzleSqliteRecordCommentRepository } from "./repositories/recordCommentRepository";
import { DrizzleSqliteRecordCursorRepository } from "./repositories/recordCursorRepository";
import { DrizzleSqliteRecordHistoryRepository } from "./repositories/recordHistoryRepository";
import { DrizzleSqliteRecordRepository } from "./repositories/recordRepository";
import { DrizzleSqliteRelatedLinkRepository } from "./repositories/relatedLinkRepository";
import { DrizzleSqliteReportRepository } from "./repositories/reportRepository";
import { DrizzleSqliteScimExternalMappingRepository } from "./repositories/scimExternalMappingRepository";
import { DrizzleSqliteSessionRepository } from "./repositories/sessionRepository";
import { DrizzleSqliteSpaceAnnouncementRepository } from "./repositories/spaceAnnouncementRepository";
import { DrizzleSqliteSpaceMemberRepository } from "./repositories/spaceMemberRepository";
import { DrizzleSqliteSpaceRepository } from "./repositories/spaceRepository";
import { DrizzleSqliteSpaceTemplateRepository } from "./repositories/spaceTemplateRepository";
import { DrizzleSqliteSystemPermissionRepository } from "./repositories/systemPermissionRepository";
// system-settings
import { DrizzleSqliteSystemSettingsRepository } from "./repositories/systemSettingsRepository";
import { DrizzleSqliteThreadActionRepository } from "./repositories/threadActionRepository";
import { DrizzleSqliteThreadCommentRepository } from "./repositories/threadCommentRepository";
import { DrizzleSqliteThreadFollowRepository } from "./repositories/threadFollowRepository";
import { DrizzleSqliteThreadRepository } from "./repositories/threadRepository";
import { DrizzleSqliteTitleAssignmentRepository } from "./repositories/titleAssignmentRepository";
import { DrizzleSqliteTitleRepository } from "./repositories/titleRepository";
import { DrizzleSqliteUserAccessUsageRepository } from "./repositories/userAccessUsageRepository";
import { DrizzleSqliteUserRepository } from "./repositories/userRepository";
import { DrizzleSqliteViewRepository } from "./repositories/viewRepository";
import { DrizzleSqliteWebhookConfigRepository } from "./repositories/webhookConfigRepository";

/**
 * Configuration for transaction retry behavior
 */
type TransactionRetryConfig = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

const DEFAULT_RETRY_CONFIG: TransactionRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
};

/**
 * Check if an error is retryable (database lock/busy errors)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // SQLite BUSY and LOCKED errors
    return (
      message.includes("sqlite_busy") ||
      message.includes("database is locked") ||
      message.includes("database is busy") ||
      message.includes("cannot start a transaction within a transaction")
    );
  }
  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateRetryDelay(
  attempt: number,
  config: TransactionRetryConfig,
): number {
  const exponentialDelay = config.baseDelayMs * 2 ** (attempt - 1);
  const jitter = Math.random() * config.baseDelayMs;
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Sleep for the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class DrizzleSqliteUnitOfWorkProvider implements UnitOfWorkProvider {
  private readonly retryConfig: TransactionRetryConfig;

  constructor(
    private readonly db: Database,
    retryConfig?: Partial<TransactionRetryConfig>,
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  async transaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.executeTransaction(fn);
      } catch (error) {
        lastError = error;

        if (isRetryableError(error) && attempt < this.retryConfig.maxRetries) {
          const delay = calculateRetryDelay(attempt, this.retryConfig);
          await sleep(delay);
          continue;
        }

        throw error;
      }
    }

    // This should not be reached, but TypeScript requires it
    throw lastError;
  }

  private async executeTransaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      // Create repositories with transaction executor
      const repositories = createRepositories(tx as Executor);

      // Create transaction context with event collector
      const ctx: TransactionContext = {
        ...repositories,
      };

      // Execute the transaction function
      return await fn(ctx);
    });
  }
}

/**
 * Create all repositories with the given database executor
 */
function createRepositories(db: Executor): Repositories {
  return {
    // audit
    auditLogRepository: new DrizzleSqliteAuditLogRepository(db),
    auditLogSettingRepository: new DrizzleSqliteAuditLogSettingRepository(db),
    userAccessUsageRepository: new DrizzleSqliteUserAccessUsageRepository(db),
    // access-control
    appAclRepository: new DrizzleSqliteAppAclRepository(db),
    fieldAclRepository: new DrizzleSqliteFieldAclRepository(db),
    orgAccessRuleRepository: new DrizzleSqliteOrgAccessRuleRepository(db),
    recordAclRepository: new DrizzleSqliteRecordAclRepository(db),
    systemPermissionRepository: new DrizzleSqliteSystemPermissionRepository(db),
    // app
    apiTokenConfigRepository: new DrizzleSqliteApiTokenConfigRepository(db),
    appActionRepository: new DrizzleSqliteAppActionRepository(db),
    appCategoryRepository: new DrizzleSqliteAppCategoryRepository(db),
    appCustomizationRepository: new DrizzleSqliteAppCustomizationRepository(db),
    appI18nConfigRepository: new DrizzleSqliteAppI18nConfigRepository(db),
    appNotificationConfigRepository:
      new DrizzleSqliteAppNotificationConfigRepository(db),
    appRepository: new DrizzleSqliteAppRepository(db),
    fieldRepository: new DrizzleSqliteFieldRepository(db),
    formLayoutRepository: new DrizzleSqliteFormLayoutRepository(db),
    pluginConfigRepository: new DrizzleSqlitePluginConfigRepository(db),
    processDefinitionRepository: new DrizzleSqliteProcessDefinitionRepository(
      db,
    ),
    reportRepository: new DrizzleSqliteReportRepository(db),
    viewRepository: new DrizzleSqliteViewRepository(db),
    webhookConfigRepository: new DrizzleSqliteWebhookConfigRepository(db),
    appGroupRepository: new DrizzleSqliteAppGroupRepository(db),
    appTemplateRepository: new DrizzleSqliteAppTemplateRepository(db),
    pluginRepository: new DrizzleSqlitePluginRepository(db),
    // bookmark
    bookmarkRepository: new DrizzleSqliteBookmarkRepository(db),
    // file
    fileRepository: new DrizzleSqliteFileRepository(db),
    // identity
    apiTokenRecordRepository: new DrizzleSqliteApiTokenRecordRepository(db),
    groupRepository: new DrizzleSqliteGroupRepository(db),
    membershipRepository: new DrizzleSqliteMembershipRepository(db),
    organizationRepository: new DrizzleSqliteOrganizationRepository(db),
    provisioningConfigRepository: new DrizzleSqliteProvisioningConfigRepository(
      db,
    ),
    scimExternalMappingRepository:
      new DrizzleSqliteScimExternalMappingRepository(db),
    sessionRepository: new DrizzleSqliteSessionRepository(db),
    titleAssignmentRepository: new DrizzleSqliteTitleAssignmentRepository(db),
    titleRepository: new DrizzleSqliteTitleRepository(db),
    userRepository: new DrizzleSqliteUserRepository(db),
    // message
    directMessageRepository: new DrizzleSqliteDirectMessageRepository(db),
    messageThreadRepository: new DrizzleSqliteMessageThreadRepository(db),
    // notification
    notificationFilterRepository: new DrizzleSqliteNotificationFilterRepository(
      db,
    ),
    notificationPreferenceRepository:
      new DrizzleSqliteNotificationPreferenceRepository(db),
    notificationRepository: new DrizzleSqliteNotificationRepository(db),
    // people
    followRepository: new DrizzleSqliteFollowRepository(db),
    postRepository: new DrizzleSqlitePostRepository(db),
    profileRepository: new DrizzleSqliteProfileRepository(db),
    // portal
    portalAnnouncementRepository: new DrizzleSqlitePortalAnnouncementRepository(
      db,
    ),
    // record
    csvExportJobRepository: new DrizzleSqliteCsvExportJobRepository(db),
    csvImportJobRepository: new DrizzleSqliteCsvImportJobRepository(db),
    recordCommentRepository: new DrizzleSqliteRecordCommentRepository(db),
    recordCursorRepository: new DrizzleSqliteRecordCursorRepository(db),
    recordHistoryRepository: new DrizzleSqliteRecordHistoryRepository(db),
    recordRepository: new DrizzleSqliteRecordRepository(db),
    // space
    commentLikeRepository: new DrizzleSqliteCommentLikeRepository(db),
    relatedLinkRepository: new DrizzleSqliteRelatedLinkRepository(db),
    spaceAnnouncementRepository: new DrizzleSqliteSpaceAnnouncementRepository(
      db,
    ),
    spaceMemberRepository: new DrizzleSqliteSpaceMemberRepository(db),
    spaceRepository: new DrizzleSqliteSpaceRepository(db),
    spaceTemplateRepository: new DrizzleSqliteSpaceTemplateRepository(db),
    threadActionRepository: new DrizzleSqliteThreadActionRepository(db),
    threadCommentRepository: new DrizzleSqliteThreadCommentRepository(db),
    threadFollowRepository: new DrizzleSqliteThreadFollowRepository(db),
    threadRepository: new DrizzleSqliteThreadRepository(db),
    // system-settings
    systemSettingsRepository: new DrizzleSqliteSystemSettingsRepository(db),
  };
}
