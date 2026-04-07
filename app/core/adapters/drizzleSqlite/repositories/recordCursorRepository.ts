import { eq, sql } from "drizzle-orm";
import { records } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppId } from "@/core/domain/app/valueObject";
import type { RecordCursor } from "@/core/domain/record/entity";
import { RecordCursor as RecordCursorFactory } from "@/core/domain/record/entity";
import type { RecordCursorRepository } from "@/core/domain/record/ports/recordCursorRepository";
import type { CursorId, FieldCode } from "@/core/domain/record/valueObject";
import type { Executor } from "../client";

/**
 * In-memory cursor store.
 *
 * RecordCursor is a short-lived, ephemeral entity (expires in 10 minutes)
 * used for paginating through large record sets via the API.
 * Since cursors do not need to survive server restarts and are
 * scoped to a single process, an in-memory Map is appropriate.
 */
const cursorStore = new Map<string, RecordCursor>();

const MAX_ACTIVE_CURSORS = 10;

export class DrizzleSqliteRecordCursorRepository
  implements RecordCursorRepository
{
  constructor(private readonly executor: Executor) {}

  async create(
    appId: AppId,
    query: string | null,
    fields: readonly FieldCode[],
    size: number,
  ): Promise<RecordCursor> {
    try {
      // Clean up expired cursors first
      this.cleanupExpired();

      // Count active cursors
      const activeCount = this.countActiveCursors();
      if (activeCount >= MAX_ACTIVE_CURSORS) {
        throw new SystemError(
          SystemErrorCode.DatabaseError,
          `Cannot create cursor: maximum of ${MAX_ACTIVE_CURSORS} active cursors exceeded`,
        );
      }

      // Count total records matching the query
      const countResult = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(records)
        .where(eq(records.appId, appId as string));

      const totalCount = Number(countResult[0].count);

      const cursor = RecordCursorFactory.create({
        appId,
        query,
        fields,
        size,
        totalCount,
      });

      cursorStore.set(cursor.cursorId as string, cursor);

      return cursor;
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to create record cursor",
        error,
      );
    }
  }

  async findById(cursorId: CursorId): Promise<RecordCursor | null> {
    const cursor = cursorStore.get(cursorId as string);
    if (!cursor) {
      return null;
    }

    // Check if expired
    if (RecordCursorFactory.isExpired(cursor, new Date())) {
      cursorStore.delete(cursorId as string);
      return null;
    }

    // Touch (update lastAccessedAt) and store
    const touched = RecordCursorFactory.touch(cursor, new Date());
    cursorStore.set(cursorId as string, touched);

    return touched;
  }

  async delete(cursorId: CursorId): Promise<void> {
    cursorStore.delete(cursorId as string);
  }

  async countByDomain(): Promise<number> {
    this.cleanupExpired();
    return this.countActiveCursors();
  }

  private cleanupExpired(): void {
    const now = new Date();
    for (const [id, cursor] of cursorStore) {
      if (RecordCursorFactory.isExpired(cursor, now)) {
        cursorStore.delete(id);
      }
    }
  }

  private countActiveCursors(): number {
    return cursorStore.size;
  }
}
