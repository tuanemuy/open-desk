import { eq } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { NotificationSourceResolver } from "@/core/domain/notification/ports/notificationSourceResolver";
import {
  LocationType,
  NotificationSource,
  type NotificationSource as NotificationSourceType,
  type SourceType as SourceTypeType,
} from "@/core/domain/notification/valueObject";
import type { Database } from "../client";
import { apps, recordComments, records, threads } from "../schema";

export class DrizzleSqliteNotificationSourceResolver
  implements NotificationSourceResolver
{
  constructor(private readonly db: Database) {}

  async resolve(
    sourceType: SourceTypeType,
    sourceId: string,
  ): Promise<NotificationSourceType | null> {
    try {
      switch (sourceType) {
        case "RECORD":
          return await this.resolveRecord(sourceId);
        case "COMMENT":
          return await this.resolveComment(sourceId);
        case "THREAD":
          return await this.resolveThread(sourceId);
        default:
          return null;
      }
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        `Failed to resolve notification source: ${sourceType}/${sourceId}`,
        error,
      );
    }
  }

  private async resolveRecord(
    recordId: string,
  ): Promise<NotificationSourceType | null> {
    const results = await this.db
      .select({
        appId: records.appId,
        spaceId: apps.spaceId,
      })
      .from(records)
      .innerJoin(apps, eq(records.appId, apps.id))
      .where(eq(records.id, recordId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return NotificationSource.create({
      appId: row.appId,
      spaceId: row.spaceId,
      locationType: LocationType.create("APP"),
    });
  }

  private async resolveComment(
    commentId: string,
  ): Promise<NotificationSourceType | null> {
    const results = await this.db
      .select({
        appId: recordComments.appId,
        spaceId: apps.spaceId,
      })
      .from(recordComments)
      .innerJoin(apps, eq(recordComments.appId, apps.id))
      .where(eq(recordComments.id, commentId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return NotificationSource.create({
      appId: row.appId,
      spaceId: row.spaceId,
      locationType: LocationType.create("APP"),
    });
  }

  private async resolveThread(
    threadId: string,
  ): Promise<NotificationSourceType | null> {
    const results = await this.db
      .select({
        spaceId: threads.spaceId,
      })
      .from(threads)
      .where(eq(threads.id, threadId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return NotificationSource.create({
      appId: null,
      spaceId: row.spaceId,
      locationType: LocationType.create("SPACE"),
    });
  }
}
