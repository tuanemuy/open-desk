import { AnyError } from "@/lib/error";
import type { AccessControlErrorCode } from "./access-control/errorCode";
import type { AppErrorCode } from "./app/errorCode";
import type { BookmarkErrorCode } from "./bookmark/errorCode";
import type { FileErrorCode } from "./file/errorCode";
import type { IdentityErrorCode } from "./identity/errorCode";
import type { MessageErrorCode } from "./message/errorCode";
import type { NotificationErrorCode } from "./notification/errorCode";
import type { PeopleErrorCode } from "./people/errorCode";
import type { PortalErrorCode } from "./portal/errorCode";
import type { RecordErrorCode } from "./record/errorCode";
import type { SearchErrorCode } from "./search/errorCode";
import type { SpaceErrorCode } from "./space/errorCode";

export type BusinessRuleErrorCode =
  | AccessControlErrorCode
  | AppErrorCode
  | BookmarkErrorCode
  | FileErrorCode
  | IdentityErrorCode
  | MessageErrorCode
  | NotificationErrorCode
  | PeopleErrorCode
  | PortalErrorCode
  | RecordErrorCode
  | SearchErrorCode
  | SpaceErrorCode;

/**
 * Domain Layer - Business Rule Error
 *
 * Represents a violation of business rules in the domain layer.
 * This error is thrown when domain logic determines that an operation cannot proceed.
 */
export class BusinessRuleError extends AnyError {
  override readonly name = "BusinessRuleError";

  constructor(
    public readonly code: BusinessRuleErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

export function isBusinessRuleError(
  error: unknown,
): error is BusinessRuleError {
  return error instanceof BusinessRuleError;
}
