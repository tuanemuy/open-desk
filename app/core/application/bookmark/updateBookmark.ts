import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { Bookmark } from "@/core/domain/bookmark/entity";
import { BookmarkId } from "@/core/domain/bookmark/valueObject";
import { UserId } from "@/core/domain/identity/valueObject";
import type { BookmarkOutput } from "./dto";

export type UpdateBookmarkInput = {
  operatorId: string;
  bookmarkId: string;
  name?: string;
  url?: string;
};

export async function updateBookmark({
  container,
  input,
}: ServiceArgs<UpdateBookmarkInput>): Promise<BookmarkOutput> {
  if (input.operatorId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Operator ID is required",
    );
  }
  if (input.bookmarkId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Bookmark ID is required",
    );
  }

  const operatorId = UserId.create(input.operatorId);
  const bookmarkId = BookmarkId.create(input.bookmarkId);

  const existingBookmark = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.bookmarkRepository.findById(bookmarkId);
    },
  );

  if (!existingBookmark) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Bookmark ${input.bookmarkId} not found`,
    );
  }

  if (!Bookmark.isOwnedBy(existingBookmark, operatorId)) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "Only the bookmark owner can edit this bookmark",
    );
  }

  let bookmark = existingBookmark;

  if (input.name !== undefined) {
    const { entity: updated } = Bookmark.updateName(bookmark, input.name);
    bookmark = updated;
  }

  if (input.url !== undefined) {
    const { entity: updated } = Bookmark.updateUrl(bookmark, input.url);
    bookmark = updated;
  }

  const bookmarkToSave = bookmark;
  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.bookmarkRepository.save(bookmarkToSave);
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
