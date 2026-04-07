import type { AppAclRepository } from "@/core/domain/access-control/ports/appAclRepository";
import type { FieldAclRepository } from "@/core/domain/access-control/ports/fieldAclRepository";
import type { RecordAclRepository } from "@/core/domain/access-control/ports/recordAclRepository";
import type { SystemPermissionRepository } from "@/core/domain/access-control/ports/systemPermissionRepository";
import type { ApiTokenConfigRepository } from "@/core/domain/app/ports/apiTokenConfigRepository";
import type { AppActionRepository } from "@/core/domain/app/ports/appActionRepository";
import type { AppCategoryRepository } from "@/core/domain/app/ports/appCategoryRepository";
import type { AppCustomizationRepository } from "@/core/domain/app/ports/appCustomizationRepository";
import type { AppI18nConfigRepository } from "@/core/domain/app/ports/appI18nConfigRepository";
import type { AppNotificationConfigRepository } from "@/core/domain/app/ports/appNotificationConfigRepository";
import type { AppRepository } from "@/core/domain/app/ports/appRepository";
import type { FieldRepository } from "@/core/domain/app/ports/fieldRepository";
import type { FormLayoutRepository } from "@/core/domain/app/ports/formLayoutRepository";
import type { PluginConfigRepository } from "@/core/domain/app/ports/pluginConfigRepository";
import type { ProcessDefinitionRepository } from "@/core/domain/app/ports/processDefinitionRepository";
import type { ReportRepository } from "@/core/domain/app/ports/reportRepository";
import type { ViewRepository } from "@/core/domain/app/ports/viewRepository";
import type { WebhookConfigRepository } from "@/core/domain/app/ports/webhookConfigRepository";
import type { BookmarkRepository } from "@/core/domain/bookmark/ports/bookmarkRepository";
import type { FileRepository } from "@/core/domain/file/ports/fileRepository";
import type { GroupRepository } from "@/core/domain/identity/ports/groupRepository";
import type { MembershipRepository } from "@/core/domain/identity/ports/membershipRepository";
import type { OrganizationRepository } from "@/core/domain/identity/ports/organizationRepository";
import type { SessionRepository } from "@/core/domain/identity/ports/sessionRepository";
import type { UserRepository } from "@/core/domain/identity/ports/userRepository";
import type { DirectMessageRepository } from "@/core/domain/message/ports/directMessageRepository";
import type { MessageThreadRepository } from "@/core/domain/message/ports/messageThreadRepository";
import type { NotificationFilterRepository } from "@/core/domain/notification/ports/notificationFilterRepository";
import type { NotificationPreferenceRepository } from "@/core/domain/notification/ports/notificationPreferenceRepository";
import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import type { FollowRepository } from "@/core/domain/people/ports/followRepository";
import type { PostRepository } from "@/core/domain/people/ports/postRepository";
import type { ProfileRepository } from "@/core/domain/people/ports/profileRepository";
import type { PortalAnnouncementRepository } from "@/core/domain/portal/ports/portalAnnouncementRepository";
import type { CsvExportJobRepository } from "@/core/domain/record/ports/csvExportJobRepository";
import type { CsvImportJobRepository } from "@/core/domain/record/ports/csvImportJobRepository";
import type { RecordCommentRepository } from "@/core/domain/record/ports/recordCommentRepository";
import type { RecordCursorRepository } from "@/core/domain/record/ports/recordCursorRepository";
import type { RecordHistoryRepository } from "@/core/domain/record/ports/recordHistoryRepository";
import type { RecordRepository } from "@/core/domain/record/ports/recordRepository";
import type { CommentLikeRepository } from "@/core/domain/space/ports/commentLikeRepository";
import type { RelatedLinkRepository } from "@/core/domain/space/ports/relatedLinkRepository";
import type { SpaceAnnouncementRepository } from "@/core/domain/space/ports/spaceAnnouncementRepository";
import type { SpaceMemberRepository } from "@/core/domain/space/ports/spaceMemberRepository";
import type { SpaceRepository } from "@/core/domain/space/ports/spaceRepository";
import type { SpaceTemplateRepository } from "@/core/domain/space/ports/spaceTemplateRepository";
import type { ThreadCommentRepository } from "@/core/domain/space/ports/threadCommentRepository";
import type { ThreadFollowRepository } from "@/core/domain/space/ports/threadFollowRepository";
import type { ThreadRepository } from "@/core/domain/space/ports/threadRepository";

export type Repositories = {
  // access-control
  appAclRepository: AppAclRepository;
  fieldAclRepository: FieldAclRepository;
  recordAclRepository: RecordAclRepository;
  systemPermissionRepository: SystemPermissionRepository;
  // app
  apiTokenConfigRepository: ApiTokenConfigRepository;
  appActionRepository: AppActionRepository;
  appCategoryRepository: AppCategoryRepository;
  appCustomizationRepository: AppCustomizationRepository;
  appI18nConfigRepository: AppI18nConfigRepository;
  appNotificationConfigRepository: AppNotificationConfigRepository;
  appRepository: AppRepository;
  fieldRepository: FieldRepository;
  formLayoutRepository: FormLayoutRepository;
  pluginConfigRepository: PluginConfigRepository;
  processDefinitionRepository: ProcessDefinitionRepository;
  reportRepository: ReportRepository;
  viewRepository: ViewRepository;
  webhookConfigRepository: WebhookConfigRepository;
  // bookmark
  bookmarkRepository: BookmarkRepository;
  // file
  fileRepository: FileRepository;
  // identity
  groupRepository: GroupRepository;
  membershipRepository: MembershipRepository;
  organizationRepository: OrganizationRepository;
  sessionRepository: SessionRepository;
  userRepository: UserRepository;
  // message
  directMessageRepository: DirectMessageRepository;
  messageThreadRepository: MessageThreadRepository;
  // notification
  notificationFilterRepository: NotificationFilterRepository;
  notificationPreferenceRepository: NotificationPreferenceRepository;
  notificationRepository: NotificationRepository;
  // people
  followRepository: FollowRepository;
  postRepository: PostRepository;
  profileRepository: ProfileRepository;
  // portal
  portalAnnouncementRepository: PortalAnnouncementRepository;
  // record
  csvExportJobRepository: CsvExportJobRepository;
  csvImportJobRepository: CsvImportJobRepository;
  recordCommentRepository: RecordCommentRepository;
  recordCursorRepository: RecordCursorRepository;
  recordHistoryRepository: RecordHistoryRepository;
  recordRepository: RecordRepository;
  // space
  commentLikeRepository: CommentLikeRepository;
  relatedLinkRepository: RelatedLinkRepository;
  spaceAnnouncementRepository: SpaceAnnouncementRepository;
  spaceMemberRepository: SpaceMemberRepository;
  spaceRepository: SpaceRepository;
  spaceTemplateRepository: SpaceTemplateRepository;
  threadCommentRepository: ThreadCommentRepository;
  threadFollowRepository: ThreadFollowRepository;
  threadRepository: ThreadRepository;
};

/**
 * Repositories with event collector for transaction context
 */
export type TransactionContext = Repositories;

export interface UnitOfWorkProvider {
  /**
   * Execute a transaction with automatic event collection and persistence.
   * Events added to the eventCollector are automatically saved to the Outbox
   * as part of the transaction.
   */
  transaction<T>(fn: (context: TransactionContext) => Promise<T>): Promise<T>;
}
