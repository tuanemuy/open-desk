import type {
  AppAcl,
  FieldAcl,
  RecordAcl,
} from "@/core/domain/access-control/entity";
import {
  AppAcl as AppAclEntity,
  FieldAcl as FieldAclEntity,
  RecordAcl as RecordAclEntity,
} from "@/core/domain/access-control/entity";
import { AccessControlErrorCode } from "@/core/domain/access-control/errorCode";
import type { FilterCondEvaluator } from "@/core/domain/access-control/ports/filterCondEvaluator";
import type {
  AppPermission as AppPermissionType,
  EffectiveRecordPermission as EffectiveRecordPermissionType,
  FieldPermission as FieldPermissionType,
  FieldValue as FieldValueType,
  RecordId as RecordIdType,
  RecordPermission as RecordPermissionType,
  UserAclContext as UserAclContextType,
} from "@/core/domain/access-control/valueObject";
import {
  AppPermission,
  EffectiveRecordPermission,
  FieldPermission,
  RecordPermission,
} from "@/core/domain/access-control/valueObject";
import type { FieldCode as FieldCodeType } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";

const MAX_BATCH_RECORDS = 100;

/**
 * Dependencies for AclEvaluationService.
 */
export type AclEvaluationServiceDeps = {
  readonly filterCondEvaluator: FilterCondEvaluator;
};

/**
 * Evaluate the app permission for a given user.
 * cybozu.com admin gets all permissions granted.
 */
export function evaluateAppPermission(
  appAcl: AppAcl,
  userContext: UserAclContextType,
  isAppCreator: boolean,
): AppPermissionType {
  if (userContext.isCybozuAdmin) {
    return AppPermission.allGranted();
  }

  return AppAclEntity.evaluateForUser(
    appAcl,
    userContext.userCode,
    userContext.organizationCodes,
    userContext.groupCodes,
    isAppCreator,
  );
}

/**
 * Evaluate the record-level effective permission for a given user/record.
 * Combines app ACL and record ACL.
 *
 * Evaluation rules:
 * 1. If app ACL denies recordViewable, all record permissions are denied
 * 2. Record ACL rules are evaluated in priority order
 * 3. First matching entity in a matching rule provides the permission
 * 4. If no record ACL rule matches, falls back to app ACL permissions
 */
export function evaluateRecordPermission(
  deps: AclEvaluationServiceDeps,
  appAcl: AppAcl,
  recordAcl: RecordAcl,
  userContext: UserAclContextType,
  isAppCreator: boolean,
  recordFieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
): RecordPermissionType {
  const appPermission = evaluateAppPermission(
    appAcl,
    userContext,
    isAppCreator,
  );

  if (!appPermission.recordViewable) {
    return RecordPermission.allDenied();
  }

  const recordPermission = RecordAclEntity.evaluateForRecord(
    recordAcl,
    userContext.userCode,
    userContext.organizationCodes,
    userContext.groupCodes,
    recordFieldValues,
    (filterCond, fieldValues) =>
      deps.filterCondEvaluator.evaluate(filterCond, fieldValues),
  );

  if (recordPermission !== null) {
    return recordPermission;
  }

  // Fallback to app ACL permissions
  return RecordPermission.create({
    viewable: appPermission.recordViewable,
    editable: appPermission.recordEditable,
    deletable: appPermission.recordDeletable,
  });
}

/**
 * Evaluate the field-level effective permissions for a given user/record.
 * Combines record-level permission with field ACL.
 *
 * Evaluation rules:
 * 1. If record-level viewable is false, all field permissions are denied
 * 2. If record-level editable is false, field editable is also false
 * 3. Field ACL overrides field permissions when rules exist
 * 4. Record-level denial always takes precedence over field ACL
 */
export function evaluateFieldPermissions(
  recordPermission: RecordPermissionType,
  fieldAcl: FieldAcl,
  userContext: UserAclContextType,
  recordFieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
  fieldCodes: readonly FieldCodeType[],
): ReadonlyMap<FieldCodeType, FieldPermissionType> {
  const result = new Map<FieldCodeType, FieldPermissionType>();

  for (const fieldCode of fieldCodes) {
    if (!recordPermission.viewable) {
      result.set(
        fieldCode,
        FieldPermission.create({ viewable: false, editable: false }),
      );
      continue;
    }

    const fieldLevel = FieldAclEntity.evaluateForField(
      fieldAcl,
      fieldCode,
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
      recordFieldValues,
    );

    const fieldPerm = FieldPermission.fromLevel(fieldLevel);

    // Record-level editable overrides field-level editable
    const effectiveEditable = recordPermission.editable && fieldPerm.editable;

    result.set(
      fieldCode,
      FieldPermission.create({
        viewable: fieldPerm.viewable,
        editable: effectiveEditable,
      }),
    );
  }

  return result;
}

/**
 * Batch evaluate effective permissions for multiple records.
 * Corresponds to the ACL evaluation API. Maximum 100 records.
 *
 * @throws TooManyRecordsError if records exceed 100
 */
export function evaluateBatch(
  deps: AclEvaluationServiceDeps,
  appAcl: AppAcl,
  recordAcl: RecordAcl,
  fieldAcl: FieldAcl,
  userContext: UserAclContextType,
  isAppCreator: boolean,
  records: readonly {
    readonly recordId: RecordIdType;
    readonly fieldValues: ReadonlyMap<FieldCodeType, FieldValueType>;
  }[],
  evaluableFieldCodes: readonly FieldCodeType[],
): EffectiveRecordPermissionType[] {
  if (records.length > MAX_BATCH_RECORDS) {
    throw new BusinessRuleError(
      AccessControlErrorCode.TooManyRecords,
      `Cannot evaluate more than ${MAX_BATCH_RECORDS} records at once`,
    );
  }

  return records.map((record) => {
    const recordPerm = evaluateRecordPermission(
      deps,
      appAcl,
      recordAcl,
      userContext,
      isAppCreator,
      record.fieldValues,
    );

    const fieldPerms = evaluateFieldPermissions(
      recordPerm,
      fieldAcl,
      userContext,
      record.fieldValues,
      evaluableFieldCodes,
    );

    return EffectiveRecordPermission.create({
      recordId: record.recordId,
      record: recordPerm,
      fields: fieldPerms,
    });
  });
}
