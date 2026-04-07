import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { spaceRelatedLinks } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { RelatedLink } from "@/core/domain/space/entity";
import type { RelatedLinkRepository } from "@/core/domain/space/ports/relatedLinkRepository";
import type {
  RelatedLinkId as RelatedLinkIdType,
  SpaceId as SpaceIdType,
} from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

type RelatedLinkDataModel = InferSelectModel<typeof spaceRelatedLinks>;

export class DrizzleSqliteRelatedLinkRepository
  implements RelatedLinkRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: RelatedLinkDataModel): RelatedLink {
    return {
      linkId: data.id as RelatedLinkIdType,
      spaceId: data.spaceId as SpaceIdType,
      title: data.title,
      url: data.url,
    };
  }

  async findById(linkId: RelatedLinkIdType): Promise<RelatedLink | null> {
    try {
      const results = await this.executor
        .select()
        .from(spaceRelatedLinks)
        .where(eq(spaceRelatedLinks.id, linkId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find related link by id",
        error,
      );
    }
  }

  async findBySpaceId(spaceId: SpaceIdType): Promise<RelatedLink[]> {
    try {
      const results = await this.executor
        .select()
        .from(spaceRelatedLinks)
        .where(eq(spaceRelatedLinks.spaceId, spaceId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find related links by space id",
        error,
      );
    }
  }

  async save(link: RelatedLink): Promise<void> {
    try {
      await this.executor
        .insert(spaceRelatedLinks)
        .values({
          id: link.linkId,
          spaceId: link.spaceId,
          title: link.title,
          url: link.url,
        })
        .onConflictDoUpdate({
          target: spaceRelatedLinks.id,
          set: {
            title: link.title,
            url: link.url,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save related link",
        error,
      );
    }
  }

  async delete(linkId: RelatedLinkIdType): Promise<void> {
    try {
      await this.executor
        .delete(spaceRelatedLinks)
        .where(eq(spaceRelatedLinks.id, linkId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete related link",
        error,
      );
    }
  }

  async deleteBySpaceId(spaceId: SpaceIdType): Promise<void> {
    try {
      await this.executor
        .delete(spaceRelatedLinks)
        .where(eq(spaceRelatedLinks.spaceId, spaceId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete related links by space id",
        error,
      );
    }
  }
}
