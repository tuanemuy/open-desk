import type { ApiTokenRecord } from "@/core/domain/identity/entity";
import type {
  ApiTokenRecordId as ApiTokenRecordIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";

/**
 * Parameters for listing API token records with pagination.
 */
export type ApiTokenRecordListParams = {
  readonly offset: number;
  readonly limit: number;
};

/**
 * Paginated API token record listing result.
 */
export type ApiTokenRecordListResult = {
  readonly items: readonly ApiTokenRecord[];
  readonly totalCount: number;
};

/**
 * Repository port for ApiTokenRecord entity persistence.
 */
export interface ApiTokenRecordRepository {
  /**
   * Save an API token record (insert or update).
   */
  save(record: ApiTokenRecord): Promise<void>;

  /**
   * Find an API token record by its unique identifier.
   */
  findById(id: ApiTokenRecordIdType): Promise<ApiTokenRecord | null>;

  /**
   * Find all API token records belonging to the specified user.
   */
  findByUserId(userId: UserIdType): Promise<ApiTokenRecord[]>;

  /**
   * List API token records with pagination.
   */
  listAll(params: ApiTokenRecordListParams): Promise<ApiTokenRecordListResult>;
}
