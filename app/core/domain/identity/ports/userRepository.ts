import type { User } from "@/core/domain/identity/entity";
import type {
  Email as EmailType,
  GroupId as GroupIdType,
  HashedPassword as HashedPasswordType,
  LoginName as LoginNameType,
  OrganizationId as OrganizationIdType,
  UserId as UserIdType,
} from "@/core/domain/identity/valueObject";

/**
 * Filter options for user listing.
 */
export type UserListFilter = {
  readonly isActive?: boolean;
  readonly keyword?: string;
};

/**
 * Parameters for listing users with pagination.
 */
export type UserListParams = {
  readonly offset: number;
  readonly limit: number;
  readonly filter?: UserListFilter;
};

/**
 * Paginated user listing result.
 */
export type UserListResult = {
  readonly users: readonly User[];
  readonly totalCount: number;
};

/**
 * Repository port for User entity persistence.
 */
export interface UserRepository {
  /**
   * Find a user by their unique identifier.
   */
  findById(userId: UserIdType): Promise<User | null>;

  /**
   * Find a user by their email address.
   */
  findByEmail(email: EmailType): Promise<User | null>;

  /**
   * Find a user by their login name.
   */
  findByLoginName(loginName: LoginNameType): Promise<User | null>;

  /**
   * Find credentials (userId and hashedPassword) by login name.
   * Used for password-based authentication.
   */
  findCredentialsByLoginName(loginName: LoginNameType): Promise<{
    userId: UserIdType;
    hashedPassword: HashedPasswordType;
    isActive: boolean;
  } | null>;

  /**
   * Find users belonging to the specified organization.
   */
  findByOrganizationId(organizationId: OrganizationIdType): Promise<User[]>;

  /**
   * Find users belonging to the specified group.
   */
  findByGroupId(groupId: GroupIdType): Promise<User[]>;

  /**
   * Save a user (insert or update).
   */
  save(user: User): Promise<void>;

  /**
   * Delete a user by their unique identifier.
   */
  delete(userId: UserIdType): Promise<void>;

  /**
   * List users with pagination and optional filtering.
   */
  list(params: UserListParams): Promise<UserListResult>;
}
