import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import type {
  FileKey,
  GroupId,
  OrganizationId,
  UserId,
} from "@/core/domain/identity/valueObject";
import { SpaceErrorCode } from "./errorCode";

// ============================================
// SpaceId
// ============================================

type _SpaceId = string & { readonly brand: "SpaceId" };

export type SpaceId = _SpaceId;

export const SpaceId = {
  create: (id: string): _SpaceId => {
    return id as _SpaceId;
  },
  generate: (): _SpaceId => {
    return uuidv7() as _SpaceId;
  },
};

// ============================================
// ThreadId
// ============================================

type _ThreadId = string & { readonly brand: "ThreadId" };

export type ThreadId = _ThreadId;

export const ThreadId = {
  create: (id: string): _ThreadId => {
    return id as _ThreadId;
  },
  generate: (): _ThreadId => {
    return uuidv7() as _ThreadId;
  },
};

// ============================================
// ThreadCommentId
// ============================================

type _ThreadCommentId = string & { readonly brand: "ThreadCommentId" };

export type ThreadCommentId = _ThreadCommentId;

export const ThreadCommentId = {
  create: (id: string): _ThreadCommentId => {
    return id as _ThreadCommentId;
  },
  generate: (): _ThreadCommentId => {
    return uuidv7() as _ThreadCommentId;
  },
};

// ============================================
// SpaceTemplateId
// ============================================

type _SpaceTemplateId = string & { readonly brand: "SpaceTemplateId" };

export type SpaceTemplateId = _SpaceTemplateId;

export const SpaceTemplateId = {
  create: (id: string): _SpaceTemplateId => {
    return id as _SpaceTemplateId;
  },
  generate: (): _SpaceTemplateId => {
    return uuidv7() as _SpaceTemplateId;
  },
};

// ============================================
// RelatedLinkId
// ============================================

type _RelatedLinkId = string & { readonly brand: "RelatedLinkId" };

export type RelatedLinkId = _RelatedLinkId;

export const RelatedLinkId = {
  create: (id: string): _RelatedLinkId => {
    return id as _RelatedLinkId;
  },
  generate: (): _RelatedLinkId => {
    return uuidv7() as _RelatedLinkId;
  },
};

// ============================================
// CommentLikeId
// ============================================

type _CommentLikeId = string & { readonly brand: "CommentLikeId" };

export type CommentLikeId = _CommentLikeId;

export const CommentLikeId = {
  create: (id: string): _CommentLikeId => {
    return id as _CommentLikeId;
  },
  generate: (): _CommentLikeId => {
    return uuidv7() as _CommentLikeId;
  },
};

// ============================================
// AppId (Space-local definition to avoid circular dependency with App domain)
// ============================================

type _AppId = string & { readonly brand: "AppId" };

export type AppId = _AppId;

export const AppId = {
  create: (id: string): _AppId => {
    return id as _AppId;
  },
  generate: (): _AppId => {
    return uuidv7() as _AppId;
  },
};

// ============================================
// SpaceName
// ============================================

const SPACE_NAME_MAX_LENGTH = 128;

type _SpaceName = string & { readonly brand: "SpaceName" };

export type SpaceName = _SpaceName;

export const SpaceName = {
  create: (value: string): _SpaceName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        SpaceErrorCode.EmptySpaceName,
        "Space name cannot be empty",
      );
    }
    if (value.length > SPACE_NAME_MAX_LENGTH) {
      throw new BusinessRuleError(
        SpaceErrorCode.SpaceNameTooLong,
        `Space name exceeds maximum length of ${SPACE_NAME_MAX_LENGTH} characters`,
      );
    }
    return value as _SpaceName;
  },
  maxLength: SPACE_NAME_MAX_LENGTH,
};

// ============================================
// ThreadTitle
// ============================================

const THREAD_TITLE_MAX_LENGTH = 128;

type _ThreadTitle = string & { readonly brand: "ThreadTitle" };

export type ThreadTitle = _ThreadTitle;

export const ThreadTitle = {
  create: (value: string): _ThreadTitle => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        SpaceErrorCode.EmptyThreadTitle,
        "Thread title cannot be empty",
      );
    }
    if (value.length > THREAD_TITLE_MAX_LENGTH) {
      throw new BusinessRuleError(
        SpaceErrorCode.ThreadTitleTooLong,
        `Thread title exceeds maximum length of ${THREAD_TITLE_MAX_LENGTH} characters`,
      );
    }
    return value as _ThreadTitle;
  },
  maxLength: THREAD_TITLE_MAX_LENGTH,
};

// ============================================
// AppCreationPermission
// ============================================

type _AppCreationPermission = "EVERYONE" | "ADMIN";

export type AppCreationPermission = _AppCreationPermission;

export const AppCreationPermission = {
  Everyone: "EVERYONE" as _AppCreationPermission,
  Admin: "ADMIN" as _AppCreationPermission,
};

// ============================================
// CoverType
// ============================================

type _CoverType = "PRESET" | "BLOB";

export type CoverType = _CoverType;

export const CoverType = {
  Preset: "PRESET" as _CoverType,
  Blob: "BLOB" as _CoverType,
};

// ============================================
// CoverImage
// ============================================

type _CoverImage = Readonly<{
  type: _CoverType;
  key: string | null;
  fileKey: FileKey | null;
  url: string | null;
}>;

export type CoverImage = _CoverImage;

export const CoverImage = {
  createPreset: (key: string): _CoverImage => {
    if (key.length === 0) {
      throw new BusinessRuleError(
        SpaceErrorCode.InvalidCoverImage,
        "Preset cover image key cannot be empty",
      );
    }
    return {
      type: CoverType.Preset,
      key,
      fileKey: null,
      url: null,
    };
  },
  createBlob: (fileKey: FileKey, url: string | null): _CoverImage => {
    return {
      type: CoverType.Blob,
      key: null,
      fileKey,
      url,
    };
  },
  default: (): _CoverImage => ({
    type: CoverType.Preset,
    key: "default",
    fileKey: null,
    url: null,
  }),
};

// ============================================
// PortalDisplayConfig
// ============================================

type _PortalDisplayConfig = Readonly<{
  showAnnouncement: boolean;
  showThreadList: boolean;
  showAppList: boolean;
  showMemberList: boolean;
  showRelatedLinkList: boolean;
}>;

export type PortalDisplayConfig = _PortalDisplayConfig;

export const PortalDisplayConfig = {
  create: (params: {
    showAnnouncement: boolean;
    showThreadList: boolean;
    showAppList: boolean;
    showMemberList: boolean;
    showRelatedLinkList: boolean;
  }): _PortalDisplayConfig => ({
    showAnnouncement: params.showAnnouncement,
    showThreadList: params.showThreadList,
    showAppList: params.showAppList,
    showMemberList: params.showMemberList,
    showRelatedLinkList: params.showRelatedLinkList,
  }),
  default: (): _PortalDisplayConfig => ({
    showAnnouncement: true,
    showThreadList: true,
    showAppList: true,
    showMemberList: true,
    showRelatedLinkList: true,
  }),
};

// ============================================
// MemberEntityType
// ============================================

type _MemberEntityType = "USER" | "ORGANIZATION" | "GROUP";

export type MemberEntityType = _MemberEntityType;

export const MemberEntityType = {
  User: "USER" as _MemberEntityType,
  Organization: "ORGANIZATION" as _MemberEntityType,
  Group: "GROUP" as _MemberEntityType,
};

// ============================================
// MemberEntity
// ============================================

type _MemberEntity = Readonly<{
  type: _MemberEntityType;
  id: UserId | OrganizationId | GroupId;
  code: string;
}>;

export type MemberEntity = _MemberEntity;

export const MemberEntity = {
  create: (params: {
    type: _MemberEntityType;
    id: UserId | OrganizationId | GroupId;
    code: string;
  }): _MemberEntity => {
    if (params.code.length === 0) {
      throw new BusinessRuleError(
        SpaceErrorCode.EmptyMemberEntityCode,
        "Member entity code cannot be empty",
      );
    }
    return {
      type: params.type,
      id: params.id,
      code: params.code,
    };
  },
  equals: (a: _MemberEntity, b: _MemberEntity): boolean => {
    return a.type === b.type && a.id === b.id;
  },
};

// ============================================
// MentionType
// ============================================

type _MentionType = "USER" | "ORGANIZATION" | "GROUP";

export type MentionType = _MentionType;

export const MentionType = {
  User: "USER" as _MentionType,
  Organization: "ORGANIZATION" as _MentionType,
  Group: "GROUP" as _MentionType,
};

// ============================================
// Mention
// ============================================

type _Mention = Readonly<{
  type: _MentionType;
  code: string;
}>;

export type Mention = _Mention;

export const Mention = {
  create: (params: { type: _MentionType; code: string }): _Mention => {
    if (params.code.length === 0) {
      throw new BusinessRuleError(
        SpaceErrorCode.EmptyMentionCode,
        "Mention code cannot be empty",
      );
    }
    return {
      type: params.type,
      code: params.code,
    };
  },
  equals: (a: _Mention, b: _Mention): boolean => {
    return a.type === b.type && a.code === b.code;
  },
};

// ============================================
// CommentFile
// ============================================

const COMMENT_FILE_WIDTH_MIN = 100;
const COMMENT_FILE_WIDTH_MAX = 750;

type _CommentFile = Readonly<{
  fileKey: FileKey;
  width: number | null;
}>;

export type CommentFile = _CommentFile;

export const CommentFile = {
  create: (params: {
    fileKey: FileKey;
    width: number | null;
  }): _CommentFile => {
    if (
      params.width !== null &&
      (params.width < COMMENT_FILE_WIDTH_MIN ||
        params.width > COMMENT_FILE_WIDTH_MAX)
    ) {
      throw new BusinessRuleError(
        SpaceErrorCode.InvalidCommentFileWidth,
        `Comment file width must be between ${COMMENT_FILE_WIDTH_MIN} and ${COMMENT_FILE_WIDTH_MAX}px`,
      );
    }
    return {
      fileKey: params.fileKey,
      width: params.width,
    };
  },
  widthMin: COMMENT_FILE_WIDTH_MIN,
  widthMax: COMMENT_FILE_WIDTH_MAX,
};
