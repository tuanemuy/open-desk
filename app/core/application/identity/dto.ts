import type { ApiScope } from "@/core/domain/identity/valueObject";

export type LoginOutput = {
  sessionId: string;
  userId: string;
  displayName: string;
  language: string;
  timezone: string;
  expiresAt: Date;
};

export type CreateUserOutput = {
  userId: string;
  loginName: string;
  displayName: string;
  email: string;
  timezone: string;
  language: string;
  isActive: boolean;
  createdAt: Date;
};

export type UpdateUserProfileOutput = {
  userId: string;
  displayName: string;
  timezone: string;
  language: string;
  timeFormat: string;
  updatedAt: Date;
};

export type UserStatusOutput = {
  userId: string;
  isActive: boolean;
  updatedAt: Date;
};

export type OrganizationOutput = {
  organizationId: string;
  name: string;
  code: string;
  parentOrganizationId: string | null;
  orderIndex: number;
};

export type GroupOutput = {
  groupId: string;
  name: string;
  code: string;
};

export type MembershipOutput = {
  userId: string;
  organizationId: string;
};

export type GroupMembershipOutput = {
  userId: string;
  groupId: string;
};

export type SessionItemOutput = {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  country: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
};

export type SessionListOutput = {
  sessions: SessionItemOutput[];
  totalCount: number;
};

export type LoginHistoryItemOutput = {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  country: string | null;
  loginAt: Date;
};

export type LoginHistoryOutput = {
  loginHistories: LoginHistoryItemOutput[];
};

export type IssueApiTokenOutput = {
  token: string;
  scopes: ApiScope[];
};

export type RefreshOAuthTokenOutput = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: ApiScope[];
};
