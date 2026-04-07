import { ValidationError, ValidationErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { Bookmark } from "@/core/domain/bookmark/entity";
import { UserId } from "@/core/domain/identity/valueObject";
import type { BookmarkOutput } from "./dto";

export type CreateBookmarkInput = {
  userId: string;
  name: string;
  url: string;
};

export async function createBookmark({
  container,
  input,
}: ServiceArgs<CreateBookmarkInput>): Promise<BookmarkOutput> {
  if (input.name.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Bookmark name is required",
    );
  }
  if (input.url.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Bookmark URL is required",
    );
  }

  const userId = UserId.create(input.userId);

  const { entity: bookmark } = Bookmark.create({
    userId,
    name: input.name,
    url: input.url,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.bookmarkRepository.save(bookmark);
  });

  return {
    bookmarkId: bookmark.bookmarkId,
    userId: bookmark.userId,
    name: bookmark.name,
    url: bookmark.url,
    category: bookmark.category,
    appId: bookmark.appId,
    createdAt: bookmark.createdAt,
  };
}
