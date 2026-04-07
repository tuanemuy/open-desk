/**
 * Output DTOs for People application services.
 */

// ============================================
// Profile DTOs
// ============================================

export type GetProfileOutput = {
  userId: string;
  displayName: string;
  email: string;
  organization: string;
  coverImageFileKey: string | null;
  comment: string;
  updatedAt: Date;
};

export type SetCoverImageOutput = {
  userId: string;
  coverImageFileKey: string;
  updatedAt: Date;
};

export type RemoveCoverImageOutput = {
  userId: string;
  coverImageFileKey: null;
  updatedAt: Date;
};

export type UpdateCommentOutput = {
  userId: string;
  comment: string;
  updatedAt: Date;
};

// ============================================
// Post DTOs
// ============================================

export type PostItemOutput = {
  postId: string;
  authorId: string;
  content: string;
  mentions: { type: string; targetId: string }[];
  attachmentFileKeys: string[];
  createdAt: Date;
};

export type CreatePostOutput = PostItemOutput;

export type DeletePostOutput = {
  postId: string;
};

export type ListPostsOutput = {
  posts: PostItemOutput[];
  totalCount: number;
  offset: number;
  limit: number;
};

// ============================================
// Follow DTOs
// ============================================

export type FollowItemOutput = {
  followerId: string;
  followeeId: string;
  createdAt: Date;
};

export type FollowOutput = FollowItemOutput;

export type UnfollowOutput = {
  followerId: string;
  followeeId: string;
};

export type ListFollowersOutput = {
  followers: FollowItemOutput[];
  totalCount: number;
  offset: number;
  limit: number;
};

export type ListFolloweesOutput = {
  followees: FollowItemOutput[];
  totalCount: number;
  offset: number;
  limit: number;
};
