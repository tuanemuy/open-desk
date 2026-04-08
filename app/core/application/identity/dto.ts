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

// Title DTOs

export type CreateTitleOutput = {
  titleId: string;
  name: string;
  orderIndex: number;
  createdAt: Date;
};

export type UpdateTitleOutput = {
  titleId: string;
  name: string;
  orderIndex: number;
  updatedAt: Date;
};

export type TitleItemOutput = {
  titleId: string;
  name: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TitleListOutput = {
  titles: TitleItemOutput[];
  totalCount: number;
};

export type TitleAssignmentOutput = {
  userId: string;
  titleId: string;
};

// Guest User DTOs

export type GuestUserItemOutput = {
  userId: string;
  displayName: string;
  email: string;
  isActive: boolean;
  guestSpaceNames: string[];
  licenseType: string;
  trialExpiresAt: Date | null;
  lastLoginAt: Date | null;
};

export type GuestUserListOutput = {
  guestUsers: GuestUserItemOutput[];
  totalCount: number;
  trialCount: number;
  paidCount: number;
  licensedCount: number;
};

// Provisioning DTOs

export type ProvisioningConfigOutput = {
  isEnabled: boolean;
  hasToken: boolean;
  tokenIssuedAt: Date | null;
  updatedAt: Date;
};

export type UpdateProvisioningConfigOutput = {
  isEnabled: boolean;
  hasToken: boolean;
  tokenIssuedAt: Date | null;
  updatedAt: Date;
  generatedToken: string | null;
};

// SCIM DTOs

export type ScimUserOutput = {
  id: string;
  externalId: string;
  userName: string;
  displayName: string;
  email: string;
  active: boolean;
  createdAt: Date;
};

export type ScimUserUpdateOutput = {
  id: string;
  externalId: string;
  userName: string;
  displayName: string;
  email: string;
  active: boolean;
  updatedAt: Date;
};

export type ScimUserDeactivateOutput = {
  id: string;
  externalId: string;
  active: boolean;
  updatedAt: Date;
};

export type ScimGroupOutput = {
  id: string;
  externalId: string;
  displayName: string;
  memberCount: number;
  createdAt: Date;
};

export type ScimGroupUpdateOutput = {
  id: string;
  externalId: string;
  displayName: string;
  memberCount: number;
  updatedAt: Date;
};
