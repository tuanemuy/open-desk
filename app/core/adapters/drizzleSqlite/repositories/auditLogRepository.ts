import type { InferSelectModel } from "drizzle-orm";
import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { auditLogs } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AuditLog } from "@/core/domain/audit/entity";
import type { AuditLogRepository } from "@/core/domain/audit/ports/auditLogRepository";
import type {
  AuditFilter as AuditFilterType,
  AuditLevel,
  AuditLogId as AuditLogIdType,
  AuditResult,
  ServiceType,
} from "@/core/domain/audit/valueObject";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type AuditLogDataModel = InferSelectModel<typeof auditLogs>;

const EXPORT_LIMIT = 100_000;

export class DrizzleSqliteAuditLogRepository implements AuditLogRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: AuditLogDataModel): AuditLog {
    return {
      auditLogId: data.id as AuditLogIdType,
      level: data.level as AuditLevel,
      timestamp: data.timestamp,
      sourceIp: data.sourceIp,
      userId: data.userId !== null ? (data.userId as UserIdType) : null,
      service: data.service as ServiceType,
      module: data.module,
      action: data.action,
      result: data.result as AuditResult,
      errorCode: data.errorCode,
    };
  }

  private buildFilterConditions(filter: AuditFilterType) {
    const conditions = [];

    if (filter.dateFrom !== null) {
      conditions.push(gte(auditLogs.timestamp, filter.dateFrom));
    }
    if (filter.dateTo !== null) {
      conditions.push(lte(auditLogs.timestamp, filter.dateTo));
    }
    if (filter.level !== null) {
      conditions.push(eq(auditLogs.level, filter.level));
    }
    if (filter.userId !== null) {
      conditions.push(eq(auditLogs.userId, filter.userId));
    }
    if (filter.service !== null) {
      conditions.push(eq(auditLogs.service, filter.service));
    }
    if (filter.module !== null) {
      conditions.push(like(auditLogs.module, `%${filter.module}%`));
    }
    if (filter.action !== null) {
      conditions.push(like(auditLogs.action, `%${filter.action}%`));
    }
    if (filter.result !== null) {
      conditions.push(eq(auditLogs.result, filter.result));
    }

    return conditions;
  }

  async findById(auditLogId: AuditLogIdType): Promise<AuditLog | null> {
    try {
      const results = await this.executor
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, auditLogId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find audit log by id",
        error,
      );
    }
  }

  async findByFilter(
    filter: AuditFilterType,
    limit: number,
    offset: number,
  ): Promise<{ logs: AuditLog[]; totalCount: number }> {
    try {
      const conditions = this.buildFilterConditions(filter);
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(auditLogs)
          .where(whereClause)
          .orderBy(desc(auditLogs.timestamp))
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: sql`count(*)` })
          .from(auditLogs)
          .where(whereClause),
      ]);

      return {
        logs: items.map((item) => this.into(item)),
        totalCount: Number(countResult[0]?.count ?? 0),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find audit logs by filter",
        error,
      );
    }
  }

  async findForExport(filter: AuditFilterType): Promise<AuditLog[]> {
    try {
      const conditions = this.buildFilterConditions(filter);
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const results = await this.executor
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.timestamp))
        .limit(EXPORT_LIMIT);

      return results.map((item) => this.into(item));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find audit logs for export",
        error,
      );
    }
  }

  async save(auditLog: AuditLog): Promise<void> {
    try {
      await this.executor.insert(auditLogs).values({
        id: auditLog.auditLogId,
        level: auditLog.level,
        timestamp: auditLog.timestamp,
        sourceIp: auditLog.sourceIp,
        userId: auditLog.userId,
        service: auditLog.service,
        module: auditLog.module,
        action: auditLog.action,
        result: auditLog.result,
        errorCode: auditLog.errorCode,
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save audit log",
        error,
      );
    }
  }

  async deleteExpired(retentionWeeks: number): Promise<number> {
    try {
      const retentionLimit = new Date();
      retentionLimit.setDate(retentionLimit.getDate() - retentionWeeks * 7);

      const result = await this.executor
        .delete(auditLogs)
        .where(lte(auditLogs.timestamp, retentionLimit));

      return result.rowsAffected;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete expired audit logs",
        error,
      );
    }
  }
}
