import type { InferSelectModel } from "drizzle-orm";
import { and, desc, eq } from "drizzle-orm";
import { recordHistories } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { RecordHistory } from "@/core/domain/record/entity";
import type { RecordHistoryRepository } from "@/core/domain/record/ports/recordHistoryRepository";
import type {
  FieldDiff,
  HistoryId,
  RecordId,
} from "@/core/domain/record/valueObject";
import type { Executor } from "../client";

type RecordHistoryDataModel = InferSelectModel<typeof recordHistories>;

export class DrizzleSqliteRecordHistoryRepository
  implements RecordHistoryRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: RecordHistoryDataModel): RecordHistory {
    return {
      historyId: data.id as HistoryId,
      recordId: data.recordId as RecordId,
      appId: data.appId as AppId,
      version: data.version,
      changedFields: (data.changedFields as unknown as FieldDiff[]) ?? [],
      modifierId: data.modifierId as UserId,
      modifiedAt: data.modifiedAt,
    };
  }

  async findByRecordId(
    appId: AppId,
    recordId: RecordId,
  ): Promise<RecordHistory[]> {
    try {
      const results = await this.executor
        .select()
        .from(recordHistories)
        .where(
          and(
            eq(recordHistories.appId, appId as string),
            eq(recordHistories.recordId, recordId as string),
          ),
        )
        .orderBy(desc(recordHistories.version));

      return results.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find record histories by record ID",
        error,
      );
    }
  }

  async findByVersion(
    appId: AppId,
    recordId: RecordId,
    version: number,
  ): Promise<RecordHistory | null> {
    try {
      const results = await this.executor
        .select()
        .from(recordHistories)
        .where(
          and(
            eq(recordHistories.appId, appId as string),
            eq(recordHistories.recordId, recordId as string),
            eq(recordHistories.version, version),
          ),
        );

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find record history by version",
        error,
      );
    }
  }

  async save(history: RecordHistory): Promise<RecordHistory> {
    try {
      await this.executor.insert(recordHistories).values({
        id: history.historyId as string,
        recordId: history.recordId as string,
        appId: history.appId as string,
        version: history.version,
        changedFields: [...history.changedFields] as unknown,
        modifierId: history.modifierId as string,
        modifiedAt: history.modifiedAt,
        createdAt: history.modifiedAt,
      });

      return history;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save record history",
        error,
      );
    }
  }
}
