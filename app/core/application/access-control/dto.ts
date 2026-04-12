import type {
  AppAclEntry,
  FieldAclRule,
  RecordAclRule,
} from "@/core/domain/access-control/entity";
import type {
  AclEntity,
  EffectiveRecordPermission,
} from "@/core/domain/access-control/valueObject";

export type AppAclOutput = {
  readonly appId: string;
  readonly rights: readonly AppAclEntry[];
  readonly revision: number;
};

export type RecordAclOutput = {
  readonly appId: string;
  readonly rights: readonly RecordAclRule[];
  readonly revision: number;
};

export type FieldAclOutput = {
  readonly appId: string;
  readonly rights: readonly FieldAclRule[];
  readonly revision: number;
};

export type SystemPermissionDto = {
  readonly systemPermissionId: string;
  readonly entity: AclEntity;
  readonly includeSubs: boolean;
  readonly systemAdmin: boolean;
  readonly appGroupViewable: boolean;
  readonly appGroupManageable: boolean;
  readonly appCreate: boolean;
  readonly appManage: boolean;
  readonly spaceCreate: boolean;
  readonly guestSpaceCreate: boolean;
};

export type SystemPermissionListOutput = {
  readonly permissions: readonly SystemPermissionDto[];
};

export type EvaluateSystemPermissionOutput = {
  readonly userId: string;
  readonly systemAdmin: boolean;
  readonly appGroupViewable: boolean;
  readonly appGroupManageable: boolean;
  readonly appCreate: boolean;
  readonly appManage: boolean;
  readonly spaceCreate: boolean;
  readonly guestSpaceCreate: boolean;
};

export type EvaluateBatchOutput = {
  readonly results: readonly EffectiveRecordPermission[];
};

export type OrgAccessRuleDto = {
  readonly orgAccessRuleId: string;
  readonly sourceOrganizationId: string;
  readonly targetOrganizationId: string;
  readonly accessLevel: import("@/core/domain/access-control/valueObject").OrgAccessLevel;
  readonly isEnabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type OrgAccessRuleListOutput = {
  readonly rules: readonly OrgAccessRuleDto[];
};

export type EvaluateOrgAccessOutput = {
  readonly userId: string;
  readonly targetOrganizationId: string;
  readonly accessLevel: import("@/core/domain/access-control/valueObject").OrgAccessLevel;
};
