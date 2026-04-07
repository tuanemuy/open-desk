import type { InferSelectModel } from "drizzle-orm";
import { and, eq, inArray, or } from "drizzle-orm";
import { systemPermissions } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { SystemPermission } from "@/core/domain/access-control/entity";
import type { SystemPermissionRepository } from "@/core/domain/access-control/ports/systemPermissionRepository";
import type {
  AclEntity,
  AclEntityType,
  SystemPermissionId,
} from "@/core/domain/access-control/valueObject";
import type { Executor } from "../client";

type SystemPermissionDataModel = InferSelectModel<typeof systemPermissions>;

export class DrizzleSqliteSystemPermissionRepository
  implements SystemPermissionRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: SystemPermissionDataModel): SystemPermission {
    return {
      systemPermissionId: data.id as SystemPermissionId,
      entity: {
        type: data.entityType as AclEntityType,
        code: data.entityCode ?? null,
      },
      includeSubs: data.includeSubs,
      systemAdmin: data.systemAdmin,
      appGroupViewable: data.appGroupViewable,
      appGroupManageable: data.appGroupManageable,
      appCreate: data.appCreate,
      appManage: data.appManage,
      spaceCreate: data.spaceCreate,
      guestSpaceCreate: data.guestSpaceCreate,
      updatedAt: data.updatedAt,
    };
  }

  async findAll(): Promise<SystemPermission[]> {
    try {
      const results = await this.executor.select().from(systemPermissions);

      return results.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all system permissions",
        error,
      );
    }
  }

  async findByEntity(entity: AclEntity): Promise<SystemPermission | null> {
    try {
      const conditions = [
        eq(systemPermissions.entityType, entity.type as string),
      ];

      if (entity.code !== null) {
        conditions.push(
          eq(systemPermissions.entityCode, entity.code as string),
        );
      }

      const results = await this.executor
        .select()
        .from(systemPermissions)
        .where(and(...conditions));

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find system permission by entity",
        error,
      );
    }
  }

  async findByUser(
    userCode: string,
    organizationCodes: readonly string[],
    groupCodes: readonly string[],
  ): Promise<SystemPermission[]> {
    try {
      const conditions = [];

      // Match by user
      conditions.push(
        and(
          eq(systemPermissions.entityType, "USER"),
          eq(systemPermissions.entityCode, userCode),
        ),
      );

      // Match by organization
      if (organizationCodes.length > 0) {
        conditions.push(
          and(
            eq(systemPermissions.entityType, "ORGANIZATION"),
            inArray(systemPermissions.entityCode, [...organizationCodes]),
          ),
        );
      }

      // Match by group
      if (groupCodes.length > 0) {
        conditions.push(
          and(
            eq(systemPermissions.entityType, "GROUP"),
            inArray(systemPermissions.entityCode, [...groupCodes]),
          ),
        );
      }

      const results = await this.executor
        .select()
        .from(systemPermissions)
        .where(or(...conditions));

      return results.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find system permissions by user",
        error,
      );
    }
  }

  async save(permission: SystemPermission): Promise<SystemPermission> {
    try {
      const values = {
        id: permission.systemPermissionId as string,
        entityType: permission.entity.type as string,
        entityCode: (permission.entity.code as string) ?? "",
        includeSubs: permission.includeSubs,
        systemAdmin: permission.systemAdmin,
        appGroupViewable: permission.appGroupViewable,
        appGroupManageable: permission.appGroupManageable,
        appCreate: permission.appCreate,
        appManage: permission.appManage,
        spaceCreate: permission.spaceCreate,
        guestSpaceCreate: permission.guestSpaceCreate,
        updatedAt: permission.updatedAt,
      };

      await this.executor
        .insert(systemPermissions)
        .values(values)
        .onConflictDoUpdate({
          target: systemPermissions.id,
          set: {
            includeSubs: values.includeSubs,
            systemAdmin: values.systemAdmin,
            appGroupViewable: values.appGroupViewable,
            appGroupManageable: values.appGroupManageable,
            appCreate: values.appCreate,
            appManage: values.appManage,
            spaceCreate: values.spaceCreate,
            guestSpaceCreate: values.guestSpaceCreate,
            updatedAt: values.updatedAt,
          },
        });

      return permission;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save system permission",
        error,
      );
    }
  }

  async delete(systemPermissionId: SystemPermissionId): Promise<void> {
    try {
      await this.executor
        .delete(systemPermissions)
        .where(eq(systemPermissions.id, systemPermissionId as string));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete system permission",
        error,
      );
    }
  }
}
