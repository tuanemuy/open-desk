import type {
  AppId as AppIdType,
  FieldCode as FieldCodeType,
} from "@/core/domain/app/valueObject";
import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import { AccessControlErrorCode } from "./errorCode";
import type {
  AppAclEvent,
  FieldAclEvent,
  RecordAclEvent,
  SystemPermissionEvent,
} from "./events";
import { AccessControlEvents } from "./events";
import type {
  AclEntity as AclEntityType,
  AppPermission as AppPermissionType,
  FieldPermissionLevel,
  FieldValue as FieldValueType,
  RecordPermission as RecordPermissionType,
  SystemPermissionId as SystemPermissionIdType,
  SystemRightType,
} from "./valueObject";
import {
  AclEntity,
  AppPermission,
  RecordPermission,
  SystemPermissionId,
} from "./valueObject";

// ============================================
// Helpers
// ============================================

/**
 * Check if a user matches an ACL entity.
 */
function entityMatchesUser(
  entity: AclEntityType,
  userCode: string,
  organizationCodes: readonly string[],
  groupCodes: readonly string[],
  isCreator: boolean,
  includeSubs: boolean,
  recordFieldValues?: ReadonlyMap<FieldCodeType, FieldValueType>,
): boolean {
  switch (entity.type) {
    case "USER":
      return entity.code === userCode;
    case "ORGANIZATION":
      if (includeSubs) {
        return organizationCodes.includes(entity.code as string);
      }
      return organizationCodes.includes(entity.code as string);
    case "GROUP":
      return groupCodes.includes(entity.code as string);
    case "CREATOR":
      return isCreator;
    case "FIELD_ENTITY": {
      if (!recordFieldValues) {
        return false;
      }
      const fieldValue = recordFieldValues.get(
        entity.code as unknown as FieldCodeType,
      );
      if (!fieldValue) {
        return false;
      }
      // FIELD_ENTITY matches if the user code is found in the field value.
      // The field value is expected to be a user/org/group selection field.
      const value = fieldValue.value;
      if (Array.isArray(value)) {
        return value.some(
          (v: unknown) =>
            (typeof v === "string" && v === userCode) ||
            (typeof v === "object" &&
              v !== null &&
              "code" in v &&
              (v as { code: string }).code === userCode),
        );
      }
      if (typeof value === "string") {
        return value === userCode;
      }
      if (
        typeof value === "object" &&
        value !== null &&
        "code" in value &&
        (value as { code: string }).code === userCode
      ) {
        return true;
      }
      return false;
    }
  }
}

/**
 * Sort entries so that Everyone group is always at the end.
 */
function sortEveryoneToEnd<T extends { readonly entity: AclEntityType }>(
  entries: readonly T[],
): T[] {
  const everyone: T[] = [];
  const others: T[] = [];
  for (const entry of entries) {
    if (AclEntity.isEveryone(entry.entity)) {
      everyone.push(entry);
    } else {
      others.push(entry);
    }
  }
  return [...others, ...everyone];
}

/**
 * Check for duplicate entities in a list.
 */
function hasDuplicateEntities(
  entities: readonly { readonly entity: AclEntityType }[],
): boolean {
  const seen = new Set<string>();
  for (const e of entities) {
    const key = `${e.entity.type}:${e.entity.code}`;
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }
  return false;
}

// ============================================
// AppAclEntry
// ============================================

export type AppAclEntry = Readonly<{
  entity: AclEntityType;
  includeSubs: boolean;
  appEditable: boolean;
  recordViewable: boolean;
  recordAddable: boolean;
  recordEditable: boolean;
  recordDeletable: boolean;
  recordImportable: boolean;
  recordExportable: boolean;
}>;

// ============================================
// AppAcl Entity
// ============================================

type _AppAcl = Readonly<{
  appId: AppIdType;
  rights: readonly AppAclEntry[];
  revision: number;
  updatedAt: Date;
}>;

export type AppAcl = _AppAcl;

export const AppAcl = {
  /**
   * Reconstruct an AppAcl entity from persisted data.
   */
  reconstruct: (data: _AppAcl): _AppAcl => data,

  /**
   * Replace the entire rights list.
   * - Everyone group is automatically moved to the end (lowest priority)
   * - Permission dependencies are validated
   *
   * @throws EmptyRightsError if entries is empty
   * @throws DuplicateEntityError if same entity appears multiple times
   * @throws PermissionDependencyError if edit/delete permissions lack view permission
   * @throws ImportDependencyError if import permission lacks add permission
   */
  updateRights: (
    appAcl: _AppAcl,
    entries: readonly AppAclEntry[],
  ): WithEvents<_AppAcl, AppAclEvent> => {
    if (entries.length === 0) {
      throw new BusinessRuleError(
        AccessControlErrorCode.EmptyRights,
        "App ACL rights must contain at least one entry",
      );
    }

    if (hasDuplicateEntities(entries)) {
      throw new BusinessRuleError(
        AccessControlErrorCode.DuplicateEntity,
        "Duplicate entity found in App ACL rights",
      );
    }

    for (const entry of entries) {
      if (entry.recordEditable && !entry.recordViewable) {
        throw new BusinessRuleError(
          AccessControlErrorCode.PermissionDependency,
          "recordEditable requires recordViewable",
        );
      }
      if (entry.recordDeletable && !entry.recordViewable) {
        throw new BusinessRuleError(
          AccessControlErrorCode.PermissionDependency,
          "recordDeletable requires recordViewable",
        );
      }
      if (entry.recordImportable && !entry.recordAddable) {
        throw new BusinessRuleError(
          AccessControlErrorCode.ImportDependency,
          "recordImportable requires recordAddable",
        );
      }
    }

    const sortedEntries = sortEveryoneToEnd(entries);

    return {
      entity: {
        ...appAcl,
        rights: sortedEntries,
        updatedAt: new Date(),
      },
      events: [AccessControlEvents.appAclUpdated(appAcl.appId)],
    };
  },

  /**
   * Optimistic lock check.
   * If expectedRevision is undefined, the check is skipped.
   * @throws RevisionConflictError if revisions do not match
   */
  checkRevision: (appAcl: _AppAcl, expectedRevision?: number): void => {
    if (
      expectedRevision !== undefined &&
      appAcl.revision !== expectedRevision
    ) {
      throw new BusinessRuleError(
        AccessControlErrorCode.RevisionConflict,
        `Revision conflict: expected ${expectedRevision}, actual ${appAcl.revision}`,
      );
    }
  },

  /**
   * Evaluate the app permission for a given user.
   * Scans rights in priority order and returns the permission of the first matching entry.
   *
   * @returns AppPermission of the first matching entry, or all-denied if no match
   */
  evaluateForUser: (
    appAcl: _AppAcl,
    userCode: string,
    organizationCodes: readonly string[],
    groupCodes: readonly string[],
    isCreator: boolean,
  ): AppPermissionType => {
    for (const entry of appAcl.rights) {
      if (
        entityMatchesUser(
          entry.entity,
          userCode,
          organizationCodes,
          groupCodes,
          isCreator,
          entry.includeSubs,
        )
      ) {
        return AppPermission.create({
          appEditable: entry.appEditable,
          recordViewable: entry.recordViewable,
          recordAddable: entry.recordAddable,
          recordEditable: entry.recordEditable,
          recordDeletable: entry.recordDeletable,
          recordImportable: entry.recordImportable,
          recordExportable: entry.recordExportable,
        });
      }
    }
    return AppPermission.allDenied();
  },
};

// ============================================
// RecordAclEntity
// ============================================

export type RecordAclEntity = Readonly<{
  entity: AclEntityType;
  includeSubs: boolean;
  viewable: boolean;
  editable: boolean;
  deletable: boolean;
}>;

// ============================================
// RecordAclRule
// ============================================

export type RecordAclRule = Readonly<{
  filterCond: string | null;
  entities: readonly RecordAclEntity[];
}>;

// ============================================
// RecordAcl Entity
// ============================================

type _RecordAcl = Readonly<{
  appId: AppIdType;
  rights: readonly RecordAclRule[];
  revision: number;
  updatedAt: Date;
}>;

export type RecordAcl = _RecordAcl;

export const RecordAcl = {
  /**
   * Reconstruct a RecordAcl entity from persisted data.
   */
  reconstruct: (data: _RecordAcl): _RecordAcl => data,

  /**
   * Replace the entire rules list.
   * - Everyone group within each rule is moved to the end
   * - Permission dependencies are validated
   *
   * @throws PermissionDependencyError if edit/delete permissions lack view permission
   * @throws DuplicateEntityInRuleError if same entity appears multiple times within a rule
   */
  updateRights: (
    recordAcl: _RecordAcl,
    rules: readonly RecordAclRule[],
  ): WithEvents<_RecordAcl, RecordAclEvent> => {
    const sortedRules: RecordAclRule[] = [];

    for (const rule of rules) {
      if (hasDuplicateEntities(rule.entities)) {
        throw new BusinessRuleError(
          AccessControlErrorCode.DuplicateEntityInRule,
          "Duplicate entity found in Record ACL rule",
        );
      }

      for (const ent of rule.entities) {
        if (ent.editable && !ent.viewable) {
          throw new BusinessRuleError(
            AccessControlErrorCode.PermissionDependency,
            "editable requires viewable in Record ACL",
          );
        }
        if (ent.deletable && !ent.viewable) {
          throw new BusinessRuleError(
            AccessControlErrorCode.PermissionDependency,
            "deletable requires viewable in Record ACL",
          );
        }
      }

      sortedRules.push({
        filterCond: rule.filterCond,
        entities: sortEveryoneToEnd(rule.entities),
      });
    }

    return {
      entity: {
        ...recordAcl,
        rights: sortedRules,
        updatedAt: new Date(),
      },
      events: [AccessControlEvents.recordAclUpdated(recordAcl.appId)],
    };
  },

  /**
   * Optimistic lock check.
   * @throws RevisionConflictError if revisions do not match
   */
  checkRevision: (recordAcl: _RecordAcl, expectedRevision?: number): void => {
    if (
      expectedRevision !== undefined &&
      recordAcl.revision !== expectedRevision
    ) {
      throw new BusinessRuleError(
        AccessControlErrorCode.RevisionConflict,
        `Revision conflict: expected ${expectedRevision}, actual ${recordAcl.revision}`,
      );
    }
  },

  /**
   * Evaluate the record permission for a given user/record.
   * Scans rules in priority order, evaluating filterCond against the record.
   * Within a matching rule, scans entities in priority order.
   *
   * @param filterCondEvaluator Evaluates filterCond against record field values
   * @returns RecordPermission of the first matching entity, or null (fallback to app ACL)
   */
  evaluateForRecord: (
    recordAcl: _RecordAcl,
    userCode: string,
    organizationCodes: readonly string[],
    groupCodes: readonly string[],
    recordFieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
    filterCondEvaluator: (
      filterCond: string | null,
      fieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
    ) => boolean,
  ): RecordPermissionType | null => {
    for (const rule of recordAcl.rights) {
      if (!filterCondEvaluator(rule.filterCond, recordFieldValues)) {
        continue;
      }

      for (const ent of rule.entities) {
        if (
          entityMatchesUser(
            ent.entity,
            userCode,
            organizationCodes,
            groupCodes,
            false,
            ent.includeSubs,
            recordFieldValues,
          )
        ) {
          return RecordPermission.create({
            viewable: ent.viewable,
            editable: ent.editable,
            deletable: ent.deletable,
          });
        }
      }
    }
    return null;
  },
};

// ============================================
// FieldAclEntity
// ============================================

export type FieldAclEntity = Readonly<{
  entity: AclEntityType;
  includeSubs: boolean;
  accessibility: FieldPermissionLevel;
}>;

// ============================================
// FieldAclRule
// ============================================

export type FieldAclRule = Readonly<{
  fieldCode: FieldCodeType;
  entities: readonly FieldAclEntity[];
}>;

// ============================================
// FieldAcl Entity
// ============================================

type _FieldAcl = Readonly<{
  appId: AppIdType;
  rights: readonly FieldAclRule[];
  revision: number;
  updatedAt: Date;
}>;

export type FieldAcl = _FieldAcl;

export const FieldAcl = {
  /**
   * Reconstruct a FieldAcl entity from persisted data.
   */
  reconstruct: (data: _FieldAcl): _FieldAcl => data,

  /**
   * Replace the entire rules list.
   * - Everyone group within each rule is moved to the end
   * - Duplicate field codes are rejected
   * - Duplicate entities within a rule are rejected
   *
   * @throws DuplicateFieldCodeError if same field code appears in multiple rules
   * @throws DuplicateEntityInRuleError if same entity appears multiple times within a rule
   */
  updateRights: (
    fieldAcl: _FieldAcl,
    rules: readonly FieldAclRule[],
  ): WithEvents<_FieldAcl, FieldAclEvent> => {
    const fieldCodeSet = new Set<string>();

    const sortedRules: FieldAclRule[] = [];

    for (const rule of rules) {
      const fieldCodeStr = rule.fieldCode as string;
      if (fieldCodeSet.has(fieldCodeStr)) {
        throw new BusinessRuleError(
          AccessControlErrorCode.DuplicateFieldCode,
          `Duplicate field code in Field ACL: ${fieldCodeStr}`,
        );
      }
      fieldCodeSet.add(fieldCodeStr);

      if (hasDuplicateEntities(rule.entities)) {
        throw new BusinessRuleError(
          AccessControlErrorCode.DuplicateEntityInRule,
          `Duplicate entity found in Field ACL rule for field: ${fieldCodeStr}`,
        );
      }

      sortedRules.push({
        fieldCode: rule.fieldCode,
        entities: sortEveryoneToEnd(rule.entities),
      });
    }

    return {
      entity: {
        ...fieldAcl,
        rights: sortedRules,
        updatedAt: new Date(),
      },
      events: [AccessControlEvents.fieldAclUpdated(fieldAcl.appId)],
    };
  },

  /**
   * Optimistic lock check.
   * @throws RevisionConflictError if revisions do not match
   */
  checkRevision: (fieldAcl: _FieldAcl, expectedRevision?: number): void => {
    if (
      expectedRevision !== undefined &&
      fieldAcl.revision !== expectedRevision
    ) {
      throw new BusinessRuleError(
        AccessControlErrorCode.RevisionConflict,
        `Revision conflict: expected ${expectedRevision}, actual ${fieldAcl.revision}`,
      );
    }
  },

  /**
   * Evaluate the field permission level for a given user/field.
   * Finds the rule for the specified field code, then scans entities in priority order.
   *
   * @returns FieldPermissionLevel of the first matching entity.
   *          If no rule exists for the field, returns "WRITE" (no restriction).
   */
  evaluateForField: (
    fieldAcl: _FieldAcl,
    fieldCode: FieldCodeType,
    userCode: string,
    organizationCodes: readonly string[],
    groupCodes: readonly string[],
    recordFieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
  ): FieldPermissionLevel => {
    const rule = fieldAcl.rights.find(
      (r) => (r.fieldCode as string) === (fieldCode as string),
    );

    // No rule defined for this field: default is WRITE (full access)
    if (!rule) {
      return "WRITE";
    }

    for (const ent of rule.entities) {
      if (
        entityMatchesUser(
          ent.entity,
          userCode,
          organizationCodes,
          groupCodes,
          false,
          ent.includeSubs,
          recordFieldValues,
        )
      ) {
        return ent.accessibility;
      }
    }

    // No matching entity within the rule: access is denied (NONE)
    // This happens when Everyone is omitted from the rule
    return "NONE";
  },
};

// ============================================
// SystemPermission Entity
// ============================================

type _SystemPermission = Readonly<{
  systemPermissionId: SystemPermissionIdType;
  entity: AclEntityType;
  includeSubs: boolean;
  systemAdmin: boolean;
  appGroupViewable: boolean;
  appGroupManageable: boolean;
  appCreate: boolean;
  appManage: boolean;
  spaceCreate: boolean;
  guestSpaceCreate: boolean;
  updatedAt: Date;
}>;

export type SystemPermission = _SystemPermission;

export const SystemPermission = {
  /**
   * Create a new SystemPermission entity.
   * The entity type must be USER, GROUP, or ORGANIZATION.
   * guestSpaceCreate defaults to false.
   */
  create: (params: {
    entity: AclEntityType;
    includeSubs: boolean;
    systemAdmin: boolean;
    appGroupViewable: boolean;
    appGroupManageable: boolean;
    appCreate: boolean;
    appManage: boolean;
    spaceCreate: boolean;
    guestSpaceCreate?: boolean;
  }): WithEvents<_SystemPermission, SystemPermissionEvent> => {
    if (
      params.entity.type !== "USER" &&
      params.entity.type !== "GROUP" &&
      params.entity.type !== "ORGANIZATION"
    ) {
      throw new BusinessRuleError(
        AccessControlErrorCode.InvalidSystemEntityType,
        `System permission entity type must be USER, GROUP, or ORGANIZATION, got ${params.entity.type}`,
      );
    }

    const permission: _SystemPermission = {
      systemPermissionId: SystemPermissionId.generate(),
      entity: params.entity,
      includeSubs: params.includeSubs,
      systemAdmin: params.systemAdmin,
      appGroupViewable: params.appGroupViewable,
      appGroupManageable: params.appGroupManageable,
      appCreate: params.appCreate,
      appManage: params.appManage,
      spaceCreate: params.spaceCreate,
      guestSpaceCreate: params.guestSpaceCreate ?? false,
      updatedAt: new Date(),
    };

    return {
      entity: permission,
      events: [
        AccessControlEvents.systemPermissionUpdated(
          permission.systemPermissionId,
        ),
      ],
    };
  },

  /**
   * Reconstruct a SystemPermission entity from persisted data.
   */
  reconstruct: (data: _SystemPermission): _SystemPermission => data,

  /**
   * Update the permission flags.
   * systemAdmin being true makes all other permissions implicitly true when evaluated.
   */
  updateRights: (
    permission: _SystemPermission,
    params: {
      systemAdmin: boolean;
      appGroupViewable: boolean;
      appGroupManageable: boolean;
      appCreate: boolean;
      appManage: boolean;
      spaceCreate: boolean;
      guestSpaceCreate: boolean;
    },
  ): WithEvents<_SystemPermission, SystemPermissionEvent> => {
    return {
      entity: {
        ...permission,
        systemAdmin: params.systemAdmin,
        appGroupViewable: params.appGroupViewable,
        appGroupManageable: params.appGroupManageable,
        appCreate: params.appCreate,
        appManage: params.appManage,
        spaceCreate: params.spaceCreate,
        guestSpaceCreate: params.guestSpaceCreate,
        updatedAt: new Date(),
      },
      events: [
        AccessControlEvents.systemPermissionUpdated(
          permission.systemPermissionId,
        ),
      ],
    };
  },

  /**
   * Check whether a specific system right is granted.
   * If systemAdmin is true, all rights are considered granted.
   */
  hasRight: (
    permission: _SystemPermission,
    right: SystemRightType,
  ): boolean => {
    if (permission.systemAdmin) {
      return true;
    }
    switch (right) {
      case "SYSTEM_ADMIN":
        return permission.systemAdmin;
      case "APP_GROUP_VIEWABLE":
        return permission.appGroupViewable;
      case "APP_GROUP_MANAGEABLE":
        return permission.appGroupManageable;
      case "APP_CREATE":
        return permission.appCreate;
      case "APP_MANAGE":
        return permission.appManage;
      case "SPACE_CREATE":
        return permission.spaceCreate;
      case "GUEST_SPACE_CREATE":
        return permission.guestSpaceCreate;
    }
  },
};
