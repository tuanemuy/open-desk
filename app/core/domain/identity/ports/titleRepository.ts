import type { Title } from "@/core/domain/identity/entity";
import type { TitleId as TitleIdType } from "@/core/domain/identity/valueObject";

/**
 * Parameters for listing titles with pagination.
 */
export type TitleListParams = {
  readonly offset: number;
  readonly limit: number;
  readonly keyword?: string;
};

/**
 * Paginated title listing result.
 */
export type TitleListResult = {
  readonly titles: readonly Title[];
  readonly totalCount: number;
};

/**
 * Repository port for Title entity persistence.
 */
export interface TitleRepository {
  /**
   * Find a title by its unique identifier.
   */
  findById(titleId: TitleIdType): Promise<Title | null>;

  /**
   * Find a title by its name.
   */
  findByName(name: string): Promise<Title | null>;

  /**
   * Save a title (insert or update).
   */
  save(title: Title): Promise<void>;

  /**
   * Delete a title by its unique identifier.
   */
  delete(titleId: TitleIdType): Promise<void>;

  /**
   * List titles with pagination and optional keyword search.
   */
  list(params: TitleListParams): Promise<TitleListResult>;
}
