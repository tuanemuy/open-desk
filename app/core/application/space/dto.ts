import type {
  AppCreationPermission,
  AppId,
  CommentFile,
  CoverImage,
  MemberEntity,
  Mention,
  PortalDisplayConfig,
} from "@/core/domain/space/valueObject";

export type SpaceDto = {
  readonly spaceId: string;
  readonly name: string;
  readonly isPrivate: boolean;
  readonly isGuest: boolean;
  readonly useMultiThread: boolean;
  readonly fixedMember: boolean;
  readonly appCreationPermission: AppCreationPermission;
  readonly coverImage: CoverImage;
  readonly portalDisplay: PortalDisplayConfig;
  readonly defaultThreadId: string;
  readonly creatorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateSpaceOutput = {
  readonly spaceId: string;
  readonly name: string;
  readonly isPrivate: boolean;
  readonly useMultiThread: boolean;
  readonly fixedMember: boolean;
  readonly appCreationPermission: AppCreationPermission;
  readonly coverImage: CoverImage;
  readonly defaultThreadId: string;
  readonly createdAt: Date;
};

export type CreateSpaceFromTemplateOutput = CreateSpaceOutput & {
  readonly threads: readonly {
    readonly threadId: string;
    readonly title: string;
  }[];
};

export type CreateGuestSpaceOutput = CreateSpaceOutput & {
  readonly isGuest: boolean;
};

export type UpdateSpaceOutput = {
  readonly spaceId: string;
  readonly name: string;
  readonly isPrivate: boolean;
  readonly isGuest: boolean;
  readonly useMultiThread: boolean;
  readonly fixedMember: boolean;
  readonly appCreationPermission: AppCreationPermission;
  readonly coverImage: CoverImage;
  readonly portalDisplay: PortalDisplayConfig;
  readonly updatedAt: Date;
};

export type SpaceUsageDto = {
  readonly spaceId: string;
  readonly name: string;
  readonly isGuest: boolean;
  readonly memberCount: number;
  readonly adminCount: number;
  readonly createdAt: Date;
};

export type SpaceUsageListOutput = {
  readonly spaces: readonly SpaceUsageDto[];
  readonly totalCount: number;
};

export type MemberDto = {
  readonly entity: MemberEntity;
  readonly isAdmin: boolean;
  readonly includeSubs: boolean;
};

export type MemberListOutput = {
  readonly members: readonly MemberDto[];
};

export type ThreadDto = {
  readonly threadId: string;
  readonly spaceId: string;
  readonly title: string;
  readonly body: string | null;
  readonly creatorId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ThreadCommentDto = {
  readonly commentId: string;
  readonly threadId: string;
  readonly spaceId: string;
  readonly text: string | null;
  readonly mentions: readonly Mention[];
  readonly files: readonly CommentFile[];
  readonly creatorId: string;
  readonly createdAt: Date;
};

export type AnnouncementOutput = {
  readonly spaceId: string;
  readonly body: string;
  readonly updatedBy: string;
  readonly updatedAt: Date;
};

export type RelatedLinkDto = {
  readonly linkId: string;
  readonly spaceId: string;
  readonly title: string;
  readonly url: string;
};

export type ToggleLikeOutput = {
  readonly liked: boolean;
};

export type CreateSpaceTemplateOutput = {
  readonly templateId: string;
  readonly name: string;
  readonly sourceSpaceId: string;
  readonly useMultiThread: boolean;
  readonly fixedMember: boolean;
  readonly appCreationPermission: AppCreationPermission;
  readonly coverImage: CoverImage;
  readonly portalDisplay: PortalDisplayConfig;
  readonly threadNames: readonly string[];
  readonly appIds: readonly AppId[];
  readonly relatedLinks: readonly RelatedLinkDto[];
  readonly announcementBody: string | undefined;
  readonly createdAt: Date;
};

export type SpaceTemplateListOutput = {
  readonly templates: readonly {
    readonly templateId: string;
    readonly name: string;
    readonly sourceSpaceId: string;
    readonly useMultiThread: boolean;
    readonly createdAt: Date;
  }[];
  readonly totalCount: number;
};

export type AddGuestUserOutput = {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly company: string | null;
};

export type ThreadActionDto = {
  readonly threadActionId: string;
  readonly actionName: string;
  readonly destinationAppId: string;
  readonly fieldMappings: readonly import("@/core/domain/space/valueObject").ThreadActionFieldMapping[];
  readonly modifierId: string;
  readonly modifiedAt: Date;
  readonly createdAt: Date;
};

export type ThreadActionListOutput = {
  readonly actions: readonly ThreadActionDto[];
  readonly totalCount: number;
};

export type RestoreSpaceOutput = {
  readonly spaceId: string;
  readonly name: string;
  readonly isPrivate: boolean;
  readonly useMultiThread: boolean;
  readonly fixedMember: boolean;
  readonly appCreationPermission: AppCreationPermission;
  readonly coverImage: CoverImage;
  readonly defaultThreadId: string;
  readonly createdAt: Date;
};
