import type { InferSelectModel } from "drizzle-orm";
import { asc, eq, like, sql } from "drizzle-orm";
import { titles } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Title } from "@/core/domain/identity/entity";
import type {
  TitleListParams,
  TitleListResult,
  TitleRepository,
} from "@/core/domain/identity/ports/titleRepository";
import type { TitleId as TitleIdType } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type TitleDataModel = InferSelectModel<typeof titles>;

export class DrizzleSqliteTitleRepository implements TitleRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: TitleDataModel): Title {
    return {
      titleId: data.id as TitleIdType,
      name: data.name,
      orderIndex: data.orderIndex,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async findById(titleId: TitleIdType): Promise<Title | null> {
    try {
      const results = await this.executor
        .select()
        .from(titles)
        .where(eq(titles.id, titleId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find title by id",
        error,
      );
    }
  }

  async findByName(name: string): Promise<Title | null> {
    try {
      const results = await this.executor
        .select()
        .from(titles)
        .where(eq(titles.name, name))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find title by name",
        error,
      );
    }
  }

  async save(title: Title): Promise<void> {
    try {
      await this.executor
        .insert(titles)
        .values({
          id: title.titleId,
          name: title.name,
          orderIndex: title.orderIndex,
          createdAt: title.createdAt,
          updatedAt: title.updatedAt,
        })
        .onConflictDoUpdate({
          target: titles.id,
          set: {
            name: title.name,
            orderIndex: title.orderIndex,
            updatedAt: title.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save title",
        error,
      );
    }
  }

  async delete(titleId: TitleIdType): Promise<void> {
    try {
      await this.executor.delete(titles).where(eq(titles.id, titleId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete title",
        error,
      );
    }
  }

  async list(params: TitleListParams): Promise<TitleListResult> {
    try {
      const whereClause = params.keyword
        ? like(titles.name, `%${params.keyword}%`)
        : undefined;

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(titles)
          .where(whereClause)
          .orderBy(asc(titles.orderIndex))
          .limit(params.limit)
          .offset(params.offset),
        this.executor
          .select({ count: sql`count(*)` })
          .from(titles)
          .where(whereClause),
      ]);

      return {
        titles: items.map((item) => this.into(item)),
        totalCount: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list titles",
        error,
      );
    }
  }
}
