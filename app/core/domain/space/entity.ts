import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId } from "@/core/domain/identity/valueObject";
import { SpaceErrorCode } from "./errorCode";
import type { SpaceEvent } from "./events";
import { SpaceEvents } from "./events";
import type {
  AppCreationPermission as AppCreationPermissionType,
  AppId as AppIdType,
  CommentFile as CommentFileType,
  CommentLikeId as CommentLikeIdType,
  CoverImage as CoverImageType,
  MemberEntity as MemberEntityType,
  Mention as MentionType,
  PortalDisplayConfig as PortalDisplayConfigType,
  RelatedLinkId as RelatedLinkIdType,
  SpaceId as SpaceIdType,
  SpaceName as SpaceNameType,
  SpaceTemplateId as SpaceTemplateIdType,
  ThreadCommentId as ThreadCommentIdType,
  ThreadId as ThreadIdType,
  ThreadTitle as ThreadTitleType,
} from "./valueObject";
import {
  CommentLikeId,
  RelatedLinkId,
  SpaceId,
  SpaceName,
  SpaceTemplateId,
  ThreadCommentId,
  ThreadId,
  ThreadTitle,
} from "./valueObject";

// ============================================
// Constants
// ============================================

const THREAD_BODY_MAX_LENGTH = 65535;
const COMMENT_TEXT_MAX_LENGTH = 65535;
const COMMENT_MENTIONS_MAX_COUNT = 10;
const COMMENT_FILES_MAX_COUNT = 5;
const ANNOUNCEMENT_BODY_MAX_LENGTH = 65535;

// ============================================
// Space Entity
// ============================================

type _Space = Readonly<{
  spaceId: SpaceIdType;
  name: SpaceNameType;
  isPrivate: boolean;
  isGuest: boolean;
  useMultiThread: boolean;
  fixedMember: boolean;
  coverImage: CoverImageType;
  portalDisplay: PortalDisplayConfigType;
  appCreationPermission: AppCreationPermissionType;
  defaultThreadId: ThreadIdType;
  creatorId: UserId;
  createdAt: Date;
  updatedAt: Date;
}>;

export type Space = _Space;

export const Space = {
  create: (params: {
    name: string;
    isPrivate: boolean;
    isGuest: boolean;
    useMultiThread: boolean;
    fixedMember: boolean;
    coverImage: CoverImageType;
    portalDisplay: PortalDisplayConfigType;
    appCreationPermission: AppCreationPermissionType;
    creatorId: UserId;
    defaultThreadId: ThreadIdType;
  }): WithEvents<_Space, SpaceEvent> => {
    const isPrivate = params.isGuest ? true : params.isPrivate;
    const now = new Date();
    const space: _Space = {
      spaceId: SpaceId.generate(),
      name: SpaceName.create(params.name),
      isPrivate,
      isGuest: params.isGuest,
      useMultiThread: params.useMultiThread,
      fixedMember: params.fixedMember,
      coverImage: params.coverImage,
      portalDisplay: params.portalDisplay,
      appCreationPermission: params.appCreationPermission,
      defaultThreadId: params.defaultThreadId,
      creatorId: params.creatorId,
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: space,
      events: [SpaceEvents.spaceCreated(space.spaceId, params.creatorId)],
    };
  },

  reconstruct: (data: _Space): _Space => data,

  rename: (space: _Space, name: string): WithEvents<_Space, SpaceEvent> => {
    return {
      entity: {
        ...space,
        name: SpaceName.create(name),
        updatedAt: new Date(),
      },
      events: [SpaceEvents.spaceSettingsUpdated(space.spaceId)],
    };
  },

  setPrivate: (
    space: _Space,
    isPrivate: boolean,
  ): WithEvents<_Space, SpaceEvent> => {
    if (space.isGuest) {
      throw new BusinessRuleError(
        SpaceErrorCode.GuestSpacePrivacy,
        "Guest space privacy cannot be changed; it is always private",
      );
    }
    return {
      entity: {
        ...space,
        isPrivate,
        updatedAt: new Date(),
      },
      events: [SpaceEvents.spaceSettingsUpdated(space.spaceId)],
    };
  },

  enableMultiThread: (space: _Space): WithEvents<_Space, SpaceEvent> => {
    if (space.useMultiThread) {
      throw new BusinessRuleError(
        SpaceErrorCode.MultiThreadIrreversible,
        "Multi-thread is already enabled and cannot be changed",
      );
    }
    return {
      entity: {
        ...space,
        useMultiThread: true,
        updatedAt: new Date(),
      },
      events: [SpaceEvents.spaceSettingsUpdated(space.spaceId)],
    };
  },

  setFixedMember: (
    space: _Space,
    fixedMember: boolean,
  ): WithEvents<_Space, SpaceEvent> => {
    return {
      entity: {
        ...space,
        fixedMember,
        updatedAt: new Date(),
      },
      events: [SpaceEvents.spaceSettingsUpdated(space.spaceId)],
    };
  },

  setCoverImage: (
    space: _Space,
    coverImage: CoverImageType,
  ): WithEvents<_Space, SpaceEvent> => {
    return {
      entity: {
        ...space,
        coverImage,
        updatedAt: new Date(),
      },
      events: [SpaceEvents.spaceSettingsUpdated(space.spaceId)],
    };
  },

  setPortalDisplay: (
    space: _Space,
    config: PortalDisplayConfigType,
  ): WithEvents<_Space, SpaceEvent> => {
    return {
      entity: {
        ...space,
        portalDisplay: config,
        updatedAt: new Date(),
      },
      events: [SpaceEvents.spaceSettingsUpdated(space.spaceId)],
    };
  },

  setAppCreationPermission: (
    space: _Space,
    permission: AppCreationPermissionType,
  ): WithEvents<_Space, SpaceEvent> => {
    return {
      entity: {
        ...space,
        appCreationPermission: permission,
        updatedAt: new Date(),
      },
      events: [SpaceEvents.spaceSettingsUpdated(space.spaceId)],
    };
  },
};

// ============================================
// Thread Entity
// ============================================

type _Thread = Readonly<{
  threadId: ThreadIdType;
  spaceId: SpaceIdType;
  title: ThreadTitleType;
  body: string | null;
  creatorId: UserId;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  notifyOnCreate: boolean;
}>;

export type Thread = _Thread;

export const Thread = {
  create: (params: {
    spaceId: SpaceIdType;
    title: string;
    body?: string | null;
    creatorId: UserId;
    isDefault: boolean;
    notifyOnCreate?: boolean;
  }): WithEvents<_Thread, SpaceEvent> => {
    const body = params.body ?? null;
    if (body !== null && body.length > THREAD_BODY_MAX_LENGTH) {
      throw new BusinessRuleError(
        SpaceErrorCode.ThreadBodyTooLong,
        `Thread body exceeds maximum length of ${THREAD_BODY_MAX_LENGTH} characters`,
      );
    }

    const now = new Date();
    const thread: _Thread = {
      threadId: ThreadId.generate(),
      spaceId: params.spaceId,
      title: ThreadTitle.create(params.title),
      body,
      creatorId: params.creatorId,
      createdAt: now,
      updatedAt: now,
      isDefault: params.isDefault,
      notifyOnCreate: params.notifyOnCreate ?? false,
    };

    return {
      entity: thread,
      events: [
        SpaceEvents.threadCreated(
          thread.threadId,
          thread.spaceId,
          params.creatorId,
          thread.notifyOnCreate,
        ),
      ],
    };
  },

  reconstruct: (data: _Thread): _Thread => data,

  rename: (thread: _Thread, title: string): WithEvents<_Thread, SpaceEvent> => {
    return {
      entity: {
        ...thread,
        title: ThreadTitle.create(title),
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  updateBody: (
    thread: _Thread,
    body: string | null,
  ): WithEvents<_Thread, SpaceEvent> => {
    if (body !== null && body.length > THREAD_BODY_MAX_LENGTH) {
      throw new BusinessRuleError(
        SpaceErrorCode.ThreadBodyTooLong,
        `Thread body exceeds maximum length of ${THREAD_BODY_MAX_LENGTH} characters`,
      );
    }
    return {
      entity: {
        ...thread,
        body,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  bodyMaxLength: THREAD_BODY_MAX_LENGTH,
};

// ============================================
// ThreadComment Entity
// ============================================

type _ThreadComment = Readonly<{
  commentId: ThreadCommentIdType;
  threadId: ThreadIdType;
  spaceId: SpaceIdType;
  text: string | null;
  mentions: readonly MentionType[];
  files: readonly CommentFileType[];
  creatorId: UserId;
  createdAt: Date;
}>;

export type ThreadComment = _ThreadComment;

export const ThreadComment = {
  create: (params: {
    threadId: ThreadIdType;
    spaceId: SpaceIdType;
    text: string | null;
    mentions: readonly MentionType[];
    files: readonly CommentFileType[];
    creatorId: UserId;
  }): WithEvents<_ThreadComment, SpaceEvent> => {
    const hasText = params.text !== null && params.text.length > 0;
    const hasFiles = params.files.length > 0;

    if (!hasText && !hasFiles) {
      throw new BusinessRuleError(
        SpaceErrorCode.EmptyComment,
        "Comment must have either text or files",
      );
    }
    if (params.text !== null && params.text.length > COMMENT_TEXT_MAX_LENGTH) {
      throw new BusinessRuleError(
        SpaceErrorCode.CommentTextTooLong,
        `Comment text exceeds maximum length of ${COMMENT_TEXT_MAX_LENGTH} characters`,
      );
    }
    if (params.mentions.length > COMMENT_MENTIONS_MAX_COUNT) {
      throw new BusinessRuleError(
        SpaceErrorCode.TooManyMentions,
        `Comment cannot have more than ${COMMENT_MENTIONS_MAX_COUNT} mentions`,
      );
    }
    if (params.files.length > COMMENT_FILES_MAX_COUNT) {
      throw new BusinessRuleError(
        SpaceErrorCode.TooManyFiles,
        `Comment cannot have more than ${COMMENT_FILES_MAX_COUNT} files`,
      );
    }

    const now = new Date();
    const comment: _ThreadComment = {
      commentId: ThreadCommentId.generate(),
      threadId: params.threadId,
      spaceId: params.spaceId,
      text: params.text,
      mentions: params.mentions,
      files: params.files,
      creatorId: params.creatorId,
      createdAt: now,
    };

    return {
      entity: comment,
      events: [
        SpaceEvents.threadCommentCreated(
          comment.commentId,
          comment.threadId,
          comment.spaceId,
          params.creatorId,
        ),
      ],
    };
  },

  reconstruct: (data: _ThreadComment): _ThreadComment => data,

  textMaxLength: COMMENT_TEXT_MAX_LENGTH,
  mentionsMaxCount: COMMENT_MENTIONS_MAX_COUNT,
  filesMaxCount: COMMENT_FILES_MAX_COUNT,
};

// ============================================
// SpaceAnnouncement Entity
// ============================================

type _SpaceAnnouncement = Readonly<{
  spaceId: SpaceIdType;
  body: string;
  updatedAt: Date;
  updatedBy: UserId;
}>;

export type SpaceAnnouncement = _SpaceAnnouncement;

export const SpaceAnnouncement = {
  create: (params: {
    spaceId: SpaceIdType;
    body: string;
    updatedBy: UserId;
  }): WithEvents<_SpaceAnnouncement, SpaceEvent> => {
    if (params.body.length > ANNOUNCEMENT_BODY_MAX_LENGTH) {
      throw new BusinessRuleError(
        SpaceErrorCode.AnnouncementBodyTooLong,
        `Announcement body exceeds maximum length of ${ANNOUNCEMENT_BODY_MAX_LENGTH} characters`,
      );
    }
    const now = new Date();
    return {
      entity: {
        spaceId: params.spaceId,
        body: params.body,
        updatedAt: now,
        updatedBy: params.updatedBy,
      },
      events: [],
    };
  },

  reconstruct: (data: _SpaceAnnouncement): _SpaceAnnouncement => data,

  updateBody: (
    announcement: _SpaceAnnouncement,
    body: string,
    updatedBy: UserId,
  ): WithEvents<_SpaceAnnouncement, SpaceEvent> => {
    if (body.length > ANNOUNCEMENT_BODY_MAX_LENGTH) {
      throw new BusinessRuleError(
        SpaceErrorCode.AnnouncementBodyTooLong,
        `Announcement body exceeds maximum length of ${ANNOUNCEMENT_BODY_MAX_LENGTH} characters`,
      );
    }
    return {
      entity: {
        ...announcement,
        body,
        updatedAt: new Date(),
        updatedBy,
      },
      events: [],
    };
  },

  bodyMaxLength: ANNOUNCEMENT_BODY_MAX_LENGTH,
};

// ============================================
// SpaceMember Entity
// ============================================

type _SpaceMember = Readonly<{
  spaceId: SpaceIdType;
  entity: MemberEntityType;
  isAdmin: boolean;
  includeSubs: boolean;
}>;

export type SpaceMember = _SpaceMember;

export const SpaceMember = {
  create: (params: {
    spaceId: SpaceIdType;
    entity: MemberEntityType;
    isAdmin: boolean;
    includeSubs: boolean;
  }): WithEvents<_SpaceMember, SpaceEvent> => {
    if (params.includeSubs && params.entity.type !== "ORGANIZATION") {
      throw new BusinessRuleError(
        SpaceErrorCode.IncludeSubsNotOrganization,
        "includeSubs can only be true for ORGANIZATION member type",
      );
    }
    return {
      entity: {
        spaceId: params.spaceId,
        entity: params.entity,
        isAdmin: params.isAdmin,
        includeSubs: params.includeSubs,
      },
      events: [],
    };
  },

  reconstruct: (data: _SpaceMember): _SpaceMember => data,

  setAdmin: (
    member: _SpaceMember,
    isAdmin: boolean,
  ): WithEvents<_SpaceMember, SpaceEvent> => {
    return {
      entity: {
        ...member,
        isAdmin,
      },
      events: [],
    };
  },

  setIncludeSubs: (
    member: _SpaceMember,
    includeSubs: boolean,
  ): WithEvents<_SpaceMember, SpaceEvent> => {
    if (includeSubs && member.entity.type !== "ORGANIZATION") {
      throw new BusinessRuleError(
        SpaceErrorCode.IncludeSubsNotOrganization,
        "includeSubs can only be true for ORGANIZATION member type",
      );
    }
    return {
      entity: {
        ...member,
        includeSubs,
      },
      events: [],
    };
  },
};

// ============================================
// SpaceTemplate Entity
// ============================================

type _SpaceTemplate = Readonly<{
  templateId: SpaceTemplateIdType;
  name: string;
  sourceSpaceId: SpaceIdType;
  useMultiThread: boolean;
  fixedMember: boolean;
  appCreationPermission: AppCreationPermissionType;
  coverImage: CoverImageType;
  portalDisplay: PortalDisplayConfigType;
  threadNames: readonly string[];
  appIds: readonly AppIdType[];
  relatedLinks: readonly RelatedLink[];
  announcementBody: string | null;
  createdAt: Date;
}>;

export type SpaceTemplate = _SpaceTemplate;

export const SpaceTemplate = {
  create: (params: {
    name: string;
    sourceSpaceId: SpaceIdType;
    useMultiThread: boolean;
    fixedMember: boolean;
    appCreationPermission: AppCreationPermissionType;
    coverImage: CoverImageType;
    portalDisplay: PortalDisplayConfigType;
    threadNames: readonly string[];
    appIds: readonly AppIdType[];
    relatedLinks: readonly RelatedLink[];
    announcementBody?: string | null;
  }): WithEvents<_SpaceTemplate, SpaceEvent> => {
    if (params.name.length === 0) {
      throw new BusinessRuleError(
        SpaceErrorCode.EmptyTemplateName,
        "Template name cannot be empty",
      );
    }
    const now = new Date();
    return {
      entity: {
        templateId: SpaceTemplateId.generate(),
        name: params.name,
        sourceSpaceId: params.sourceSpaceId,
        useMultiThread: params.useMultiThread,
        fixedMember: params.fixedMember,
        appCreationPermission: params.appCreationPermission,
        coverImage: params.coverImage,
        portalDisplay: params.portalDisplay,
        threadNames: params.threadNames,
        appIds: params.appIds,
        relatedLinks: params.relatedLinks,
        announcementBody: params.announcementBody ?? null,
        createdAt: now,
      },
      events: [],
    };
  },

  reconstruct: (data: _SpaceTemplate): _SpaceTemplate => data,

  rename: (
    template: _SpaceTemplate,
    name: string,
  ): WithEvents<_SpaceTemplate, SpaceEvent> => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        SpaceErrorCode.EmptyTemplateName,
        "Template name cannot be empty",
      );
    }
    return {
      entity: {
        ...template,
        name,
      },
      events: [],
    };
  },
};

// ============================================
// RelatedLink Value Object (with identity)
// ============================================

type _RelatedLink = Readonly<{
  linkId: RelatedLinkIdType;
  spaceId: SpaceIdType;
  title: string;
  url: string;
}>;

export type RelatedLink = _RelatedLink;

const URL_REGEX = /^https?:\/\/.+/;

export const RelatedLink = {
  create: (params: {
    spaceId: SpaceIdType;
    title: string;
    url: string;
  }): WithEvents<_RelatedLink, SpaceEvent> => {
    if (params.title.length === 0) {
      throw new BusinessRuleError(
        SpaceErrorCode.EmptyRelatedLinkTitle,
        "Related link title cannot be empty",
      );
    }
    if (params.url.length === 0) {
      throw new BusinessRuleError(
        SpaceErrorCode.EmptyRelatedLinkUrl,
        "Related link URL cannot be empty",
      );
    }
    if (!URL_REGEX.test(params.url)) {
      throw new BusinessRuleError(
        SpaceErrorCode.InvalidRelatedLinkUrl,
        "Related link URL must be a valid HTTP or HTTPS URL",
      );
    }
    return {
      entity: {
        linkId: RelatedLinkId.generate(),
        spaceId: params.spaceId,
        title: params.title,
        url: params.url,
      },
      events: [],
    };
  },

  reconstruct: (data: _RelatedLink): _RelatedLink => data,
};

// ============================================
// CommentLike Value Object (with identity)
// ============================================

type _CommentLike = Readonly<{
  likeId: CommentLikeIdType;
  commentId: ThreadCommentIdType;
  userId: UserId;
  createdAt: Date;
}>;

export type CommentLike = _CommentLike;

export const CommentLike = {
  create: (params: {
    commentId: ThreadCommentIdType;
    userId: UserId;
  }): WithEvents<_CommentLike, SpaceEvent> => {
    return {
      entity: {
        likeId: CommentLikeId.generate(),
        commentId: params.commentId,
        userId: params.userId,
        createdAt: new Date(),
      },
      events: [],
    };
  },

  reconstruct: (data: _CommentLike): _CommentLike => data,
};

// ============================================
// ThreadFollow Value Object (with identity)
// ============================================

type _ThreadFollow = Readonly<{
  threadId: ThreadIdType;
  userId: UserId;
}>;

export type ThreadFollow = _ThreadFollow;

export const ThreadFollow = {
  create: (params: {
    threadId: ThreadIdType;
    userId: UserId;
  }): _ThreadFollow => ({
    threadId: params.threadId,
    userId: params.userId,
  }),

  reconstruct: (data: _ThreadFollow): _ThreadFollow => data,
};
