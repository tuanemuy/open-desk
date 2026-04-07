import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { profiles } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Profile } from "@/core/domain/people/entity";
import type { ProfileRepository } from "@/core/domain/people/ports/profileRepository";
import type { FileKey as FileKeyType } from "@/core/domain/people/valueObject";
import type { Executor } from "../client";

type ProfileDataModel = InferSelectModel<typeof profiles>;

export class DrizzleSqliteProfileRepository implements ProfileRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: ProfileDataModel): Profile {
    return {
      userId: data.userId as UserIdType,
      coverImageFileKey:
        data.coverImageFileKey !== null
          ? (data.coverImageFileKey as FileKeyType)
          : null,
      comment: data.comment,
      updatedAt: data.updatedAt,
    };
  }

  async findByUserId(userId: UserIdType): Promise<Profile | null> {
    try {
      const results = await this.executor
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find profile by user id",
        error,
      );
    }
  }

  async save(profile: Profile): Promise<void> {
    try {
      await this.executor
        .insert(profiles)
        .values({
          userId: profile.userId,
          coverImageFileKey: profile.coverImageFileKey,
          comment: profile.comment,
          updatedAt: profile.updatedAt,
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: {
            coverImageFileKey: profile.coverImageFileKey,
            comment: profile.comment,
            updatedAt: profile.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save profile",
        error,
      );
    }
  }

  async delete(userId: UserIdType): Promise<void> {
    try {
      await this.executor.delete(profiles).where(eq(profiles.userId, userId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete profile",
        error,
      );
    }
  }
}
