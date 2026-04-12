import type { InferSelectModel } from "drizzle-orm";
import { desc, eq, sql } from "drizzle-orm";
import { apiTokenRecords } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { ApiTokenRecord } from "@/core/domain/identity/entity";
import type {
  ApiTokenRecordListParams,
  ApiTokenRecordListResult,
  ApiTokenRecordRepository,
} from "@/core/domain/identity/ports/apiTokenRecordRepository";
import type {
  ApiScope,
  ApiTokenRecordId as ApiTokenRecordIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type ApiTokenRecordDataModel = InferSelectModel<typeof apiTokenRecords>;

export class DrizzleSqliteApiTokenRecordRepository
  implements ApiTokenRecordRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: ApiTokenRecordDataModel): ApiTokenRecord {
    return {
      id: data.id as ApiTokenRecordIdType,
      userId: data.userId as UserIdType,
      tokenHash: data.tokenHash,
      summary: data.summary,
      scopes: (data.scopes ?? []) as ApiScope[],
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      revokedAt: data.revokedAt,
    };
  }

  async save(record: ApiTokenRecord): Promise<void> {
    try {
      await this.executor
        .insert(apiTokenRecords)
        .values({
          id: record.id,
          userId: record.userId,
          tokenHash: record.tokenHash,
          summary: record.summary,
          scopes: [...record.scopes],
          createdAt: record.createdAt,
          expiresAt: record.expiresAt,
          revokedAt: record.revokedAt,
        })
        .onConflictDoUpdate({
          target: apiTokenRecords.id,
          set: {
            userId: record.userId,
            tokenHash: record.tokenHash,
            summary: record.summary,
            scopes: [...record.scopes],
            expiresAt: record.expiresAt,
            revokedAt: record.revokedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save API token record",
        error,
      );
    }
  }

  async findById(id: ApiTokenRecordIdType): Promise<ApiTokenRecord | null> {
    try {
      const results = await this.executor
        .select()
        .from(apiTokenRecords)
        .where(eq(apiTokenRecords.id, id))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find API token record by id",
        error,
      );
    }
  }

  async findByUserId(userId: UserIdType): Promise<ApiTokenRecord[]> {
    try {
      const results = await this.executor
        .select()
        .from(apiTokenRecords)
        .where(eq(apiTokenRecords.userId, userId))
        .orderBy(desc(apiTokenRecords.createdAt));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find API token records by user id",
        error,
      );
    }
  }

  async listAll(
    params: ApiTokenRecordListParams,
  ): Promise<ApiTokenRecordListResult> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(apiTokenRecords)
          .orderBy(desc(apiTokenRecords.createdAt))
          .limit(params.limit)
          .offset(params.offset),
        this.executor.select({ count: sql`count(*)` }).from(apiTokenRecords),
      ]);

      return {
        items: items.map((item) => this.into(item)),
        totalCount: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list API token records",
        error,
      );
    }
  }
}
