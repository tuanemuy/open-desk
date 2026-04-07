import type { InferSelectModel } from "drizzle-orm";
import { eq, inArray } from "drizzle-orm";
import {
  notificationFilterLocationConditions,
  notificationFilterSenderConditions,
  notificationFilters,
} from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { NotificationFilter } from "@/core/domain/notification/entity";
import type { NotificationFilterRepository } from "@/core/domain/notification/ports/notificationFilterRepository";
import type {
  FilterName as FilterNameType,
  FilterNotificationType as FilterNotificationTypeType,
  LocationCondition as LocationConditionType,
  LocationFilterMode as LocationFilterModeType,
  LocationType as LocationTypeType,
  NotificationFilterId as NotificationFilterIdType,
  SenderCondition as SenderConditionType,
  SenderFilterType as SenderFilterTypeType,
} from "@/core/domain/notification/valueObject";
import type { Executor } from "../client";

type NotificationFilterDataModel = InferSelectModel<typeof notificationFilters>;
type LocationConditionDataModel = InferSelectModel<
  typeof notificationFilterLocationConditions
>;
type SenderConditionDataModel = InferSelectModel<
  typeof notificationFilterSenderConditions
>;

export class DrizzleSqliteNotificationFilterRepository
  implements NotificationFilterRepository
{
  constructor(private readonly executor: Executor) {}

  private intoFilter(
    data: NotificationFilterDataModel,
    locationConditions: LocationConditionDataModel[],
    senderConditions: SenderConditionDataModel[],
  ): NotificationFilter {
    return {
      filterId: data.id as NotificationFilterIdType,
      userId: data.userId as UserIdType,
      isBuiltIn: data.isBuiltIn,
      name: data.name as FilterNameType,
      notificationType: data.notificationType as FilterNotificationTypeType,
      locationMode: data.locationMode as LocationFilterModeType,
      locationConditions: locationConditions.map(
        (lc) =>
          ({
            locationType: lc.locationType as LocationTypeType,
            locationId: lc.locationId,
          }) as LocationConditionType,
      ),
      senderConditions: senderConditions.map(
        (sc) =>
          ({
            senderType: sc.senderType as SenderFilterTypeType,
            senderId: sc.senderId,
          }) as SenderConditionType,
      ),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async findById(
    filterId: NotificationFilterIdType,
  ): Promise<NotificationFilter | null> {
    try {
      const results = await this.executor
        .select()
        .from(notificationFilters)
        .where(eq(notificationFilters.id, filterId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const filterData = results[0];

      const [locationConditions, senderConditions] = await Promise.all([
        this.executor
          .select()
          .from(notificationFilterLocationConditions)
          .where(
            eq(notificationFilterLocationConditions.filterId, filterData.id),
          ),
        this.executor
          .select()
          .from(notificationFilterSenderConditions)
          .where(
            eq(notificationFilterSenderConditions.filterId, filterData.id),
          ),
      ]);

      return this.intoFilter(filterData, locationConditions, senderConditions);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notification filter by id",
        error,
      );
    }
  }

  async findByUserId(userId: UserIdType): Promise<NotificationFilter[]> {
    try {
      const filterResults = await this.executor
        .select()
        .from(notificationFilters)
        .where(eq(notificationFilters.userId, userId))
        .orderBy(notificationFilters.createdAt);

      if (filterResults.length === 0) {
        return [];
      }

      const filterIds = filterResults.map((f) => f.id);

      const [allLocationConditions, allSenderConditions] = await Promise.all([
        this.executor
          .select()
          .from(notificationFilterLocationConditions)
          .where(
            inArray(notificationFilterLocationConditions.filterId, filterIds),
          ),
        this.executor
          .select()
          .from(notificationFilterSenderConditions)
          .where(
            inArray(notificationFilterSenderConditions.filterId, filterIds),
          ),
      ]);

      return filterResults.map((filterData) =>
        this.intoFilter(
          filterData,
          allLocationConditions.filter((lc) => lc.filterId === filterData.id),
          allSenderConditions.filter((sc) => sc.filterId === filterData.id),
        ),
      );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notification filters by user id",
        error,
      );
    }
  }

  async save(filter: NotificationFilter): Promise<NotificationFilter> {
    try {
      await this.executor
        .insert(notificationFilters)
        .values({
          id: filter.filterId,
          userId: filter.userId,
          isBuiltIn: filter.isBuiltIn,
          name: filter.name,
          notificationType: filter.notificationType,
          locationMode: filter.locationMode,
          createdAt: filter.createdAt,
          updatedAt: filter.updatedAt,
        })
        .onConflictDoUpdate({
          target: notificationFilters.id,
          set: {
            name: filter.name,
            notificationType: filter.notificationType,
            locationMode: filter.locationMode,
            updatedAt: filter.updatedAt,
          },
        });

      // Replace location conditions
      await this.executor
        .delete(notificationFilterLocationConditions)
        .where(
          eq(notificationFilterLocationConditions.filterId, filter.filterId),
        );

      if (filter.locationConditions.length > 0) {
        await this.executor.insert(notificationFilterLocationConditions).values(
          filter.locationConditions.map((lc) => ({
            filterId: filter.filterId,
            locationType: lc.locationType,
            locationId: lc.locationId,
          })),
        );
      }

      // Replace sender conditions
      await this.executor
        .delete(notificationFilterSenderConditions)
        .where(
          eq(notificationFilterSenderConditions.filterId, filter.filterId),
        );

      if (filter.senderConditions.length > 0) {
        await this.executor.insert(notificationFilterSenderConditions).values(
          filter.senderConditions.map((sc) => ({
            filterId: filter.filterId,
            senderType: sc.senderType,
            senderId: sc.senderId,
          })),
        );
      }

      return filter;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save notification filter",
        error,
      );
    }
  }

  async delete(filterId: NotificationFilterIdType): Promise<void> {
    try {
      // Cascade will handle child tables, but explicitly deleting for clarity
      await this.executor
        .delete(notificationFilterLocationConditions)
        .where(eq(notificationFilterLocationConditions.filterId, filterId));

      await this.executor
        .delete(notificationFilterSenderConditions)
        .where(eq(notificationFilterSenderConditions.filterId, filterId));

      await this.executor
        .delete(notificationFilters)
        .where(eq(notificationFilters.id, filterId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete notification filter",
        error,
      );
    }
  }
}
