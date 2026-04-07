import type { InferSelectModel, SQL } from "drizzle-orm";
import { and, count, eq, ne } from "drizzle-orm";
import { fields } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Field } from "@/core/domain/app/entity";
import type { FieldRepository } from "@/core/domain/app/ports/fieldRepository";
import type {
  AppId as AppIdType,
  FieldCode as FieldCodeType,
  FieldDefaultValue as FieldDefaultValueType,
  FieldId as FieldIdType,
  FieldProperties,
  FieldType as FieldTypeType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type FieldDataModel = InferSelectModel<typeof fields>;

export class DrizzleSqliteFieldRepository implements FieldRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: FieldDataModel): Field {
    return {
      fieldId: data.id as FieldIdType,
      appId: data.appId as AppIdType,
      fieldCode: data.fieldCode as FieldCodeType,
      label: data.label,
      noLabel: data.noLabel,
      fieldType: data.fieldType as FieldTypeType,
      required: data.required,
      unique: data.isUnique,
      defaultValue:
        data.defaultValue !== null
          ? (data.defaultValue as unknown as FieldDefaultValueType)
          : null,
      properties: data.properties as unknown as FieldProperties,
    };
  }

  async findById(fieldId: FieldIdType): Promise<Field | null> {
    try {
      const results = await this.executor
        .select()
        .from(fields)
        .where(eq(fields.id, fieldId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find field by id",
        error,
      );
    }
  }

  async findByAppId(appId: AppIdType): Promise<readonly Field[]> {
    try {
      const results = await this.executor
        .select()
        .from(fields)
        .where(eq(fields.appId, appId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find fields by app id",
        error,
      );
    }
  }

  async findByCode(
    appId: AppIdType,
    fieldCode: FieldCodeType,
  ): Promise<Field | null> {
    try {
      const results = await this.executor
        .select()
        .from(fields)
        .where(and(eq(fields.appId, appId), eq(fields.fieldCode, fieldCode)))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find field by code",
        error,
      );
    }
  }

  async save(field: Field): Promise<void> {
    try {
      await this.executor
        .insert(fields)
        .values({
          id: field.fieldId,
          appId: field.appId,
          fieldCode: field.fieldCode,
          label: field.label,
          noLabel: field.noLabel,
          fieldType: field.fieldType,
          required: field.required,
          isUnique: field.unique,
          defaultValue:
            field.defaultValue !== null
              ? (field.defaultValue as Record<string, unknown>)
              : null,
          properties: field.properties as Record<string, unknown>,
        })
        .onConflictDoUpdate({
          target: fields.id,
          set: {
            appId: field.appId,
            fieldCode: field.fieldCode,
            label: field.label,
            noLabel: field.noLabel,
            fieldType: field.fieldType,
            required: field.required,
            isUnique: field.unique,
            defaultValue:
              field.defaultValue !== null
                ? (field.defaultValue as Record<string, unknown>)
                : null,
            properties: field.properties as Record<string, unknown>,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save field",
        error,
      );
    }
  }

  async saveBatch(fieldList: readonly Field[]): Promise<void> {
    try {
      for (const field of fieldList) {
        await this.save(field);
      }
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save fields in batch",
        error,
      );
    }
  }

  async delete(fieldId: FieldIdType): Promise<void> {
    try {
      await this.executor.delete(fields).where(eq(fields.id, fieldId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete field",
        error,
      );
    }
  }

  async deleteBatch(fieldIds: readonly FieldIdType[]): Promise<void> {
    try {
      for (const fieldId of fieldIds) {
        await this.executor.delete(fields).where(eq(fields.id, fieldId));
      }
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete fields in batch",
        error,
      );
    }
  }

  async existsByCode(
    appId: AppIdType,
    fieldCode: FieldCodeType,
    excludeFieldId?: FieldIdType,
  ): Promise<boolean> {
    try {
      const conditions: SQL[] = [
        eq(fields.appId, appId),
        eq(fields.fieldCode, fieldCode),
      ];
      if (excludeFieldId !== undefined) {
        conditions.push(ne(fields.id, excludeFieldId));
      }

      const results = await this.executor
        .select({ count: count() })
        .from(fields)
        .where(and(...conditions));

      return (results[0]?.count ?? 0) > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check field existence by code",
        error,
      );
    }
  }

  async countByAppId(appId: AppIdType): Promise<number> {
    try {
      const results = await this.executor
        .select({ count: count() })
        .from(fields)
        .where(eq(fields.appId, appId));

      return results[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count fields by app id",
        error,
      );
    }
  }
}
