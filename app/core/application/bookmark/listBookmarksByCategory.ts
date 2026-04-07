import type { ServiceArgs } from "@/core/application/types";
import type { AppId } from "@/core/domain/bookmark/valueObject";
import { UserId } from "@/core/domain/identity/valueObject";
import type { BookmarkListByCategoryOutput } from "./dto";

export type ListBookmarksByCategoryInput = {
  userId: string;
};

export async function listBookmarksByCategory({
  container,
  input,
}: ServiceArgs<ListBookmarksByCategoryInput>): Promise<BookmarkListByCategoryOutput> {
  const userId = UserId.create(input.userId);

  const grouped = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.bookmarkRepository.findAllGroupedByCategory(userId);
    },
  );

  return {
    app: grouped.app.map((b) => ({
      bookmarkId: b.bookmarkId,
      name: b.name,
      url: b.url,
      appId: b.appId as AppId,
      createdAt: b.createdAt,
    })),
    search: grouped.search.map((b) => ({
      bookmarkId: b.bookmarkId,
      name: b.name,
      url: b.url,
      createdAt: b.createdAt,
    })),
    other: grouped.other.map((b) => ({
      bookmarkId: b.bookmarkId,
      name: b.name,
      url: b.url,
      createdAt: b.createdAt,
    })),
  };
}
