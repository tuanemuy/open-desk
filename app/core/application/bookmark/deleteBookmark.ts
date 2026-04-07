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
import type { DeleteBookmarkOutput } from "./dto";

export type DeleteBookmarkInput = {
  operatorId: string;
  bookmarkId: string;
};

export async function deleteBookmark({
  container,
  input,
}: ServiceArgs<DeleteBookmarkInput>): Promise<DeleteBookmarkOutput> {
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

  const bookmark = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.bookmarkRepository.findById(bookmarkId);
    },
  );

  if (!bookmark) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Bookmark ${input.bookmarkId} not found`,
    );
  }

  if (!Bookmark.isOwnedBy(bookmark, operatorId)) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "Only the bookmark owner can delete this bookmark",
    );
  }

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.bookmarkRepository.delete(bookmarkId);
  });

  return {
    bookmarkId: bookmark.bookmarkId,
  };
}
