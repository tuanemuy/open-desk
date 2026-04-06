import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { AccessControlErrorCode } from "./errorCode";

// ============================================
// SystemPermissionId
// ============================================

type _SystemPermissionId = string & { readonly brand: "SystemPermissionId" };

export type SystemPermissionId = _SystemPermissionId;

export const SystemPermissionId = {
  create: (id: string): _SystemPermissionId => {
    return id as _SystemPermissionId;
  },
  generate: (): _SystemPermissionId => {
    return uuidv7() as _SystemPermissionId;
  },
};

// ============================================
// RecordId (reference to Record domain)
// ============================================

type _RecordId = string & { readonly brand: "RecordId" };

export type RecordId = _RecordId;

export const RecordId = {
  create: (id: string): _RecordId => {
    return id as _RecordId;
  },
};

// ============================================
// FieldValue (opaque type for field values used in ACL evaluation)
// ============================================

type _FieldValue = {
  readonly type: string;
  readonly value: unknown;
};

export type FieldValue = _FieldValue;

export const FieldValue = {
  create: (type: string, value: unknown): _FieldValue => ({
    type,
    value,
  }),
};

// ============================================
// AclEntityType
// ============================================

const ACL_ENTITY_TYPES = [
  "USER",
  "GROUP",
  "ORGANIZATION",
  "CREATOR",
  "FIELD_ENTITY",
] as const;

export type AclEntityType = (typeof ACL_ENTITY_TYPES)[number];

export const AclEntityType = {
  values: ACL_ENTITY_TYPES,
  isValid: (value: string): value is AclEntityType =>
    ACL_ENTITY_TYPES.includes(value as AclEntityType),
};

// ============================================
// AclEntity
// ============================================

type _AclEntity = Readonly<{
  type: AclEntityType;
  code: string | null;
}>;

export type AclEntity = _AclEntity;

export const AclEntity = {
  create: (type: AclEntityType, code: string | null): _AclEntity => {
    if (type === "CREATOR") {
      if (code !== null) {
        throw new BusinessRuleError(
          AccessControlErrorCode.InvalidCreatorCode,
          "CREATOR entity must have null code",
        );
      }
    } else {
      if (code === null || code.length === 0) {
        throw new BusinessRuleError(
          AccessControlErrorCode.EmptyEntityCode,
          `Entity code cannot be empty for type ${type}`,
        );
      }
    }
    return { type, code };
  },

  equals: (a: _AclEntity, b: _AclEntity): boolean =>
    a.type === b.type && a.code === b.code,

  isEveryone: (entity: _AclEntity): boolean =>
    entity.type === "GROUP" && entity.code === "everyone",
};

// ============================================
// AppPermission
// ============================================

type _AppPermission = Readonly<{
  appEditable: boolean;
  recordViewable: boolean;
  recordAddable: boolean;
  recordEditable: boolean;
  recordDeletable: boolean;
  recordImportable: boolean;
  recordExportable: boolean;
}>;

export type AppPermission = _AppPermission;

export const AppPermission = {
  create: (params: {
    appEditable: boolean;
    recordViewable: boolean;
    recordAddable: boolean;
    recordEditable: boolean;
    recordDeletable: boolean;
    recordImportable: boolean;
    recordExportable: boolean;
  }): _AppPermission => ({
    appEditable: params.appEditable,
    recordViewable: params.recordViewable,
    recordAddable: params.recordAddable,
    recordEditable: params.recordEditable,
    recordDeletable: params.recordDeletable,
    recordImportable: params.recordImportable,
    recordExportable: params.recordExportable,
  }),

  allDenied: (): _AppPermission => ({
    appEditable: false,
    recordViewable: false,
    recordAddable: false,
    recordEditable: false,
    recordDeletable: false,
    recordImportable: false,
    recordExportable: false,
  }),

  allGranted: (): _AppPermission => ({
    appEditable: true,
    recordViewable: true,
    recordAddable: true,
    recordEditable: true,
    recordDeletable: true,
    recordImportable: true,
    recordExportable: true,
  }),
};

// ============================================
// RecordPermission
// ============================================

type _RecordPermission = Readonly<{
  viewable: boolean;
  editable: boolean;
  deletable: boolean;
}>;

export type RecordPermission = _RecordPermission;

export const RecordPermission = {
  create: (params: {
    viewable: boolean;
    editable: boolean;
    deletable: boolean;
  }): _RecordPermission => ({
    viewable: params.viewable,
    editable: params.editable,
    deletable: params.deletable,
  }),

  allDenied: (): _RecordPermission => ({
    viewable: false,
    editable: false,
    deletable: false,
  }),

  allGranted: (): _RecordPermission => ({
    viewable: true,
    editable: true,
    deletable: true,
  }),
};

// ============================================
// FieldPermissionLevel
// ============================================

const FIELD_PERMISSION_LEVELS = ["READ", "WRITE", "NONE"] as const;

export type FieldPermissionLevel = (typeof FIELD_PERMISSION_LEVELS)[number];

export const FieldPermissionLevel = {
  values: FIELD_PERMISSION_LEVELS,
};

// ============================================
// FieldPermission
// ============================================

type _FieldPermission = Readonly<{
  viewable: boolean;
  editable: boolean;
}>;

export type FieldPermission = _FieldPermission;

export const FieldPermission = {
  create: (params: {
    viewable: boolean;
    editable: boolean;
  }): _FieldPermission => ({
    viewable: params.viewable,
    editable: params.editable,
  }),

  fromLevel: (level: FieldPermissionLevel): _FieldPermission => {
    switch (level) {
      case "WRITE":
        return { viewable: true, editable: true };
      case "READ":
        return { viewable: true, editable: false };
      case "NONE":
        return { viewable: false, editable: false };
    }
  },
};

// ============================================
// SystemRightType
// ============================================

const SYSTEM_RIGHT_TYPES = [
  "SYSTEM_ADMIN",
  "APP_GROUP_VIEWABLE",
  "APP_GROUP_MANAGEABLE",
  "APP_CREATE",
  "APP_MANAGE",
  "SPACE_CREATE",
  "GUEST_SPACE_CREATE",
] as const;

export type SystemRightType = (typeof SYSTEM_RIGHT_TYPES)[number];

export const SystemRightType = {
  values: SYSTEM_RIGHT_TYPES,
};

// ============================================
// EffectiveRecordPermission
// ============================================

type _EffectiveRecordPermission = Readonly<{
  recordId: RecordId;
  record: RecordPermission;
  fields: ReadonlyMap<string, FieldPermission>;
}>;

export type EffectiveRecordPermission = _EffectiveRecordPermission;

export const EffectiveRecordPermission = {
  create: (params: {
    recordId: RecordId;
    record: RecordPermission;
    fields: ReadonlyMap<string, FieldPermission>;
  }): _EffectiveRecordPermission => ({
    recordId: params.recordId,
    record: params.record,
    fields: params.fields,
  }),
};

// ============================================
// UserAclContext
// ============================================

type _UserAclContext = Readonly<{
  userId: string;
  userCode: string;
  organizationCodes: readonly string[];
  groupCodes: readonly string[];
  isCybozuAdmin: boolean;
}>;

export type UserAclContext = _UserAclContext;

export const UserAclContext = {
  create: (params: {
    userId: string;
    userCode: string;
    organizationCodes: readonly string[];
    groupCodes: readonly string[];
    isCybozuAdmin: boolean;
  }): _UserAclContext => ({
    userId: params.userId,
    userCode: params.userCode,
    organizationCodes: params.organizationCodes,
    groupCodes: params.groupCodes,
    isCybozuAdmin: params.isCybozuAdmin,
  }),
};
