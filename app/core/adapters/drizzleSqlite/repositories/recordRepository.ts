import type { InferSelectModel } from "drizzle-orm";
import { and, eq, sql } from "drizzle-orm";
import { records } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { Record as RecordEntity } from "@/core/domain/record/entity";
import type { RecordRepository } from "@/core/domain/record/ports/recordRepository";
import type {
  FieldCode,
  FieldValue,
  ProcessStatus,
  RecordId,
  RecordQuery,
} from "@/core/domain/record/valueObject";
import type { Executor } from "../client";

type RecordDataModel = InferSelectModel<typeof records>;

/**
 * Convert a ReadonlyMap<FieldCode, FieldValue> to a JSON-serializable plain object.
 */
function fieldValuesToJson(
  fieldValues: ReadonlyMap<FieldCode, FieldValue>,
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of fieldValues) {
    obj[key as string] = value;
  }
  return obj;
}

/**
 * Convert a JSON object from the database back to a ReadonlyMap<FieldCode, FieldValue>.
 */
function jsonToFieldValues(json: unknown): ReadonlyMap<FieldCode, FieldValue> {
  const map = new Map<FieldCode, FieldValue>();
  if (json && typeof json === "object" && !Array.isArray(json)) {
    for (const [key, value] of Object.entries(
      json as Record<string, unknown>,
    )) {
      map.set(key as FieldCode, value as FieldValue);
    }
  }
  return map;
}

export class DrizzleSqliteRecordRepository implements RecordRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: RecordDataModel): RecordEntity {
    return {
      recordId: data.id as RecordId,
      appId: data.appId as AppId,
      revision: data.revision,
      fieldValues: jsonToFieldValues(data.fieldValues),
      status: (data.status as ProcessStatus) ?? null,
      statusAssignees: (data.statusAssignees as unknown as string[]).map(
        (id) => id as UserId,
      ),
      creatorId: data.creatorId as UserId,
      createdAt: data.createdAt,
      modifierId: data.modifierId as UserId,
      updatedAt: data.updatedAt,
    };
  }

  async findById(
    appId: AppId,
    recordId: RecordId,
  ): Promise<RecordEntity | null> {
    try {
      const results = await this.executor
        .select()
        .from(records)
        .where(
          and(
            eq(records.appId, appId as string),
            eq(records.id, recordId as string),
          ),
        );

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find record by ID",
        error,
      );
    }
  }

  async findByQuery(
    appId: AppId,
    query: RecordQuery,
    _fields?: readonly FieldCode[],
    totalCount?: boolean,
  ): Promise<{ records: RecordEntity[]; totalCount: number | null }> {
    try {
      const baseWhere = eq(records.appId, appId as string);

      const itemsQuery = this.executor
        .select()
        .from(records)
        .where(baseWhere)
        .orderBy(records.createdAt);

      if (query.limit !== null) {
        itemsQuery.limit(query.limit);
      }
      if (query.offset !== null) {
        itemsQuery.offset(query.offset);
      }

      const items = await itemsQuery;

      let count: number | null = null;
      if (totalCount) {
        const countResult = await this.executor
          .select({ count: sql<number>`count(*)` })
          .from(records)
          .where(baseWhere);
        count = Number(countResult[0].count);
      }

      return {
        records: items.map((item) => this.into(item)),
        totalCount: count,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find records by query",
        error,
      );
    }
  }

  async save(record: RecordEntity): Promise<RecordEntity> {
    try {
      const values = {
        id: record.recordId as string,
        appId: record.appId as string,
        revision: record.revision,
        fieldValues: fieldValuesToJson(record.fieldValues),
        status: (record.status as string) ?? null,
        statusAssignees: [...record.statusAssignees] as unknown as string[],
        creatorId: record.creatorId as string,
        modifierId: record.modifierId as string,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };

      await this.executor
        .insert(records)
        .values(values)
        .onConflictDoUpdate({
          target: records.id,
          set: {
            revision: values.revision,
            fieldValues: values.fieldValues,
            status: values.status,
            statusAssignees: values.statusAssignees,
            modifierId: values.modifierId,
            updatedAt: values.updatedAt,
          },
        });

      return record;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save record",
        error,
      );
    }
  }

  async saveBatch(
    recordList: readonly RecordEntity[],
  ): Promise<RecordEntity[]> {
    try {
      for (const record of recordList) {
        await this.save(record);
      }
      return [...recordList];
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save records in batch",
        error,
      );
    }
  }

  async delete(appId: AppId, recordIds: readonly RecordId[]): Promise<void> {
    try {
      for (const recordId of recordIds) {
        await this.executor
          .delete(records)
          .where(
            and(
              eq(records.appId, appId as string),
              eq(records.id, recordId as string),
            ),
          );
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete records",
        error,
      );
    }
  }

  async count(appId: AppId, _query?: RecordQuery): Promise<number> {
    try {
      const baseWhere = eq(records.appId, appId as string);

      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(records)
        .where(baseWhere);

      return Number(result[0].count);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count records",
        error,
      );
    }
  }
}
