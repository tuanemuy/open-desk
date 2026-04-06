import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import { PeopleErrorCode } from "./errorCode";
import type { FollowEvent, PostEvent, ProfileEvent } from "./events";
import { PeopleEvents } from "./events";
import type {
  FileKey as FileKeyType,
  Mention as MentionType,
  PostId as PostIdType,
  RichTextHtml as RichTextHtmlType,
} from "./valueObject";
import { PostId, RichTextHtml } from "./valueObject";

// ============================================
// Profile Entity
// ============================================

type _Profile = Readonly<{
  userId: UserIdType;
  coverImageFileKey: FileKeyType | null;
  comment: string;
  updatedAt: Date;
}>;

export type Profile = _Profile;

export const Profile = {
  /**
   * Create a new Profile entity for the given user.
   * Initialized with no cover image and an empty comment.
   */
  create: (params: {
    userId: UserIdType;
  }): WithEvents<_Profile, ProfileEvent> => {
    const now = new Date();
    const profile: _Profile = {
      userId: params.userId,
      coverImageFileKey: null,
      comment: "",
      updatedAt: now,
    };

    return {
      entity: profile,
      events: [],
    };
  },

  /**
   * Reconstruct a Profile entity from persisted data.
   */
  reconstruct: (data: _Profile): _Profile => data,

  /**
   * Set the cover image.
   * Replaces any existing cover image.
   */
  setCoverImage: (
    profile: _Profile,
    fileKey: FileKeyType,
  ): WithEvents<_Profile, ProfileEvent> => {
    return {
      entity: {
        ...profile,
        coverImageFileKey: fileKey,
        updatedAt: new Date(),
      },
      events: [PeopleEvents.profileUpdated(profile.userId)],
    };
  },

  /**
   * Remove the cover image.
   * Idempotent: does nothing if no cover image is set.
   */
  removeCoverImage: (profile: _Profile): WithEvents<_Profile, ProfileEvent> => {
    return {
      entity: {
        ...profile,
        coverImageFileKey: null,
        updatedAt: new Date(),
      },
      events: [PeopleEvents.profileUpdated(profile.userId)],
    };
  },

  /**
   * Update the comment.
   * An empty string clears the comment.
   */
  updateComment: (
    profile: _Profile,
    comment: string,
  ): WithEvents<_Profile, ProfileEvent> => {
    return {
      entity: {
        ...profile,
        comment,
        updatedAt: new Date(),
      },
      events: [PeopleEvents.profileUpdated(profile.userId)],
    };
  },
};

// ============================================
// Post Entity
// ============================================

type _Post = Readonly<{
  postId: PostIdType;
  authorId: UserIdType;
  content: RichTextHtmlType;
  mentions: readonly MentionType[];
  attachmentFileKeys: readonly FileKeyType[];
  createdAt: Date;
}>;

export type Post = _Post;

export const Post = {
  /**
   * Create a new Post entity.
   * Throws if content is empty.
   */
  create: (params: {
    authorId: UserIdType;
    content: string;
    mentions: readonly MentionType[];
    attachmentFileKeys: readonly FileKeyType[];
  }): WithEvents<_Post, PostEvent> => {
    if (params.content.length === 0) {
      throw new BusinessRuleError(
        PeopleErrorCode.EmptyPostContent,
        "Post content cannot be empty",
      );
    }

    const now = new Date();
    const post: _Post = {
      postId: PostId.generate(),
      authorId: params.authorId,
      content: RichTextHtml.create(params.content),
      mentions: params.mentions,
      attachmentFileKeys: params.attachmentFileKeys,
      createdAt: now,
    };

    return {
      entity: post,
      events: [PeopleEvents.postCreated(post.postId, post.authorId)],
    };
  },

  /**
   * Reconstruct a Post entity from persisted data.
   */
  reconstruct: (data: _Post): _Post => data,

  /**
   * Check whether the specified user is the author of this post.
   */
  isOwnedBy: (post: _Post, userId: UserIdType): boolean => {
    return post.authorId === userId;
  },
};

// ============================================
// Follow Entity
// ============================================

type _Follow = Readonly<{
  followerId: UserIdType;
  followeeId: UserIdType;
  createdAt: Date;
}>;

export type Follow = _Follow;

export const Follow = {
  /**
   * Create a new Follow relationship.
   * Throws if followerId and followeeId are the same (self-follow).
   */
  create: (params: {
    followerId: UserIdType;
    followeeId: UserIdType;
  }): WithEvents<_Follow, FollowEvent> => {
    if (params.followerId === params.followeeId) {
      throw new BusinessRuleError(
        PeopleErrorCode.SelfFollow,
        "A user cannot follow themselves",
      );
    }

    const now = new Date();
    const follow: _Follow = {
      followerId: params.followerId,
      followeeId: params.followeeId,
      createdAt: now,
    };

    return {
      entity: follow,
      events: [
        PeopleEvents.followCreated(follow.followerId, follow.followeeId),
      ],
    };
  },

  /**
   * Reconstruct a Follow entity from persisted data.
   */
  reconstruct: (data: _Follow): _Follow => data,
};
