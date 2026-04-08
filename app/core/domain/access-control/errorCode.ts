/**
 * Error codes for the AccessControl domain.
 */
export const AccessControlErrorCode = {
  // AppAcl errors
  EmptyRights: "ACCESS_CONTROL_EMPTY_RIGHTS",
  DuplicateEntity: "ACCESS_CONTROL_DUPLICATE_ENTITY",
  PermissionDependency: "ACCESS_CONTROL_PERMISSION_DEPENDENCY",
  ImportDependency: "ACCESS_CONTROL_IMPORT_DEPENDENCY",
  RevisionConflict: "ACCESS_CONTROL_REVISION_CONFLICT",

  // RecordAcl errors
  InvalidFilterCond: "ACCESS_CONTROL_INVALID_FILTER_COND",
  DuplicateEntityInRule: "ACCESS_CONTROL_DUPLICATE_ENTITY_IN_RULE",

  // FieldAcl errors
  DuplicateFieldCode: "ACCESS_CONTROL_DUPLICATE_FIELD_CODE",

  // SystemPermission errors
  InvalidSystemEntityType: "ACCESS_CONTROL_INVALID_SYSTEM_ENTITY_TYPE",

  // AclEntity errors
  EmptyEntityCode: "ACCESS_CONTROL_EMPTY_ENTITY_CODE",
  InvalidCreatorCode: "ACCESS_CONTROL_INVALID_CREATOR_CODE",

  // Evaluation errors
  TooManyRecords: "ACCESS_CONTROL_TOO_MANY_RECORDS",

  // OrgAccessRule errors
  OrgAccessRuleNotFound: "ACCESS_CONTROL_ORG_ACCESS_RULE_NOT_FOUND",
  SelfReferenceOrgAccess: "ACCESS_CONTROL_SELF_REFERENCE_ORG_ACCESS",
  DuplicateOrgAccessRule: "ACCESS_CONTROL_DUPLICATE_ORG_ACCESS_RULE",
  InvalidOrgAccessLevel: "ACCESS_CONTROL_INVALID_ORG_ACCESS_LEVEL",
} as const;

export type AccessControlErrorCode =
  (typeof AccessControlErrorCode)[keyof typeof AccessControlErrorCode];
