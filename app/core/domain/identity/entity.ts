import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import { IdentityErrorCode } from "./errorCode";
import type {
  GroupEvent,
  OrganizationEvent,
  SessionEvent,
  UserEvent,
} from "./events";
import { IdentityEvents } from "./events";
import type {
  DisplayName as DisplayNameType,
  Email as EmailType,
  FileKey as FileKeyType,
  GroupId as GroupIdType,
  Language as LanguageType,
  LoginName as LoginNameType,
  OrganizationId as OrganizationIdType,
  SessionId as SessionIdType,
  TimeFormat as TimeFormatType,
  Timezone as TimezoneType,
  UserId as UserIdType,
} from "./valueObject";
import {
  DisplayName,
  GroupId,
  Language,
  OrganizationId,
  SessionId,
  TimeFormat,
  Timezone,
  UserId,
} from "./valueObject";

// ============================================
// User Entity
// ============================================

type _User = Readonly<{
  userId: UserIdType;
  loginName: LoginNameType;
  displayName: DisplayNameType;
  email: EmailType;
  primaryOrganizationId: OrganizationIdType | null;
  timezone: TimezoneType;
  language: LanguageType;
  timeFormat: TimeFormatType;
  isActive: boolean;
  avatarFileKey: FileKeyType | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type User = _User;

export const User = {
  /**
   * Create a new User entity.
   * New users are created as active by default.
   */
  create: (params: {
    loginName: LoginNameType;
    displayName: string;
    email: EmailType;
    timezone?: TimezoneType;
    language?: LanguageType;
    timeFormat?: TimeFormatType;
  }): WithEvents<_User, UserEvent> => {
    const now = new Date();
    const user: _User = {
      userId: UserId.generate(),
      loginName: params.loginName,
      displayName: DisplayName.create(params.displayName),
      email: params.email,
      primaryOrganizationId: null,
      timezone: params.timezone ?? Timezone.default(),
      language: params.language ?? Language.default(),
      timeFormat: params.timeFormat ?? TimeFormat.default(),
      isActive: true,
      avatarFileKey: null,
      createdAt: now,
      updatedAt: now,
    };

    return {
      entity: user,
      events: [IdentityEvents.userCreated(user.userId)],
    };
  },

  /**
   * Reconstruct a User entity from persisted data.
   */
  reconstruct: (data: _User): _User => data,

  /**
   * Activate an inactive user.
   * Throws if the user is already active.
   */
  activate: (user: _User): WithEvents<_User, UserEvent> => {
    if (user.isActive) {
      throw new BusinessRuleError(
        IdentityErrorCode.AlreadyActive,
        `User ${user.userId} is already active`,
      );
    }
    return {
      entity: {
        ...user,
        isActive: true,
        updatedAt: new Date(),
      },
      events: [IdentityEvents.userActivated(user.userId)],
    };
  },

  /**
   * Deactivate an active user.
   * Throws if the user is already inactive.
   */
  deactivate: (user: _User): WithEvents<_User, UserEvent> => {
    if (!user.isActive) {
      throw new BusinessRuleError(
        IdentityErrorCode.AlreadyInactive,
        `User ${user.userId} is already inactive`,
      );
    }
    return {
      entity: {
        ...user,
        isActive: false,
        updatedAt: new Date(),
      },
      events: [IdentityEvents.userDeactivated(user.userId)],
    };
  },

  /**
   * Update the user's profile information.
   */
  updateProfile: (
    user: _User,
    params: {
      displayName: string;
      timezone: TimezoneType;
      language: LanguageType;
      timeFormat: TimeFormatType;
    },
  ): WithEvents<_User, UserEvent> => {
    return {
      entity: {
        ...user,
        displayName: DisplayName.create(params.displayName),
        timezone: params.timezone,
        language: params.language,
        timeFormat: params.timeFormat,
        updatedAt: new Date(),
      },
      events: [IdentityEvents.userProfileUpdated(user.userId)],
    };
  },

  /**
   * Change the user's avatar image.
   */
  changeAvatar: (
    user: _User,
    fileKey: FileKeyType,
  ): WithEvents<_User, UserEvent> => {
    return {
      entity: {
        ...user,
        avatarFileKey: fileKey,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  /**
   * Remove the user's avatar image.
   */
  removeAvatar: (user: _User): WithEvents<_User, UserEvent> => {
    return {
      entity: {
        ...user,
        avatarFileKey: null,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  /**
   * Set the user's primary organization.
   */
  setPrimaryOrganization: (
    user: _User,
    organizationId: OrganizationIdType,
  ): WithEvents<_User, UserEvent> => {
    return {
      entity: {
        ...user,
        primaryOrganizationId: organizationId,
        updatedAt: new Date(),
      },
      events: [],
    };
  },

  /**
   * Clear the user's primary organization.
   */
  clearPrimaryOrganization: (user: _User): WithEvents<_User, UserEvent> => {
    return {
      entity: {
        ...user,
        primaryOrganizationId: null,
        updatedAt: new Date(),
      },
      events: [],
    };
  },
};

// ============================================
// Organization Entity
// ============================================

type _Organization = Readonly<{
  organizationId: OrganizationIdType;
  name: string;
  code: string;
  parentOrganizationId: OrganizationIdType | null;
  orderIndex: number;
}>;

export type Organization = _Organization;

export const Organization = {
  /**
   * Create a new Organization entity.
   */
  create: (params: {
    name: string;
    code: string;
    parentOrganizationId?: OrganizationIdType | null;
    orderIndex?: number;
  }): WithEvents<_Organization, OrganizationEvent> => {
    if (params.name.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyOrganizationName,
        "Organization name cannot be empty",
      );
    }
    if (params.code.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyOrganizationCode,
        "Organization code cannot be empty",
      );
    }
    const orderIndex = params.orderIndex ?? 0;
    if (orderIndex < 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidOrderIndex,
        `Order index must be non-negative, got ${orderIndex}`,
      );
    }

    const organization: _Organization = {
      organizationId: OrganizationId.generate(),
      name: params.name,
      code: params.code,
      parentOrganizationId: params.parentOrganizationId ?? null,
      orderIndex,
    };

    return {
      entity: organization,
      events: [IdentityEvents.organizationCreated(organization.organizationId)],
    };
  },

  /**
   * Reconstruct an Organization entity from persisted data.
   */
  reconstruct: (data: _Organization): _Organization => data,

  /**
   * Rename the organization.
   * Throws if the new name is empty.
   */
  rename: (
    organization: _Organization,
    name: string,
  ): WithEvents<_Organization, OrganizationEvent> => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyOrganizationName,
        "Organization name cannot be empty",
      );
    }
    return {
      entity: {
        ...organization,
        name,
      },
      events: [],
    };
  },

  /**
   * Move the organization to a new parent.
   * Throws if attempting to set itself as the parent.
   * Circular reference detection across the tree is handled by OrganizationService.
   */
  moveTo: (
    organization: _Organization,
    parentOrganizationId: OrganizationIdType | null,
  ): WithEvents<_Organization, OrganizationEvent> => {
    if (
      parentOrganizationId !== null &&
      parentOrganizationId === organization.organizationId
    ) {
      throw new BusinessRuleError(
        IdentityErrorCode.SelfParentReference,
        "An organization cannot be its own parent",
      );
    }
    return {
      entity: {
        ...organization,
        parentOrganizationId,
      },
      events: [],
    };
  },

  /**
   * Change the display order index within the same parent.
   * Throws if the index is negative.
   */
  reorder: (
    organization: _Organization,
    index: number,
  ): WithEvents<_Organization, OrganizationEvent> => {
    if (index < 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidOrderIndex,
        `Order index must be non-negative, got ${index}`,
      );
    }
    return {
      entity: {
        ...organization,
        orderIndex: index,
      },
      events: [],
    };
  },
};

// ============================================
// Group Entity
// ============================================

type _Group = Readonly<{
  groupId: GroupIdType;
  name: string;
  code: string;
}>;

export type Group = _Group;

export const Group = {
  /**
   * Create a new Group entity.
   */
  create: (params: {
    name: string;
    code: string;
  }): WithEvents<_Group, GroupEvent> => {
    if (params.name.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyGroupName,
        "Group name cannot be empty",
      );
    }
    if (params.code.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyGroupCode,
        "Group code cannot be empty",
      );
    }

    const group: _Group = {
      groupId: GroupId.generate(),
      name: params.name,
      code: params.code,
    };

    return {
      entity: group,
      events: [IdentityEvents.groupCreated(group.groupId)],
    };
  },

  /**
   * Reconstruct a Group entity from persisted data.
   */
  reconstruct: (data: _Group): _Group => data,

  /**
   * Rename the group.
   * Throws if the new name is empty.
   */
  rename: (group: _Group, name: string): WithEvents<_Group, GroupEvent> => {
    if (name.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyGroupName,
        "Group name cannot be empty",
      );
    }
    return {
      entity: {
        ...group,
        name,
      },
      events: [],
    };
  },
};

// ============================================
// Session Entity
// ============================================

type _Session = Readonly<{
  sessionId: SessionIdType;
  userId: UserIdType;
  ipAddress: string;
  userAgent: string;
  country: string | null;
  createdAt: Date;
  expiresAt: Date;
}>;

export type Session = _Session;

export const Session = {
  /**
   * Create a new Session entity.
   */
  create: (params: {
    userId: UserIdType;
    ipAddress: string;
    userAgent: string;
    country?: string | null;
    timeoutMinutes: number;
  }): WithEvents<_Session, SessionEvent> => {
    if (params.ipAddress.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyIpAddress,
        "IP address cannot be empty",
      );
    }
    if (params.userAgent.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyUserAgent,
        "User agent cannot be empty",
      );
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + params.timeoutMinutes * 60 * 1000,
    );

    const session: _Session = {
      sessionId: SessionId.generate(),
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      country: params.country ?? null,
      createdAt: now,
      expiresAt,
    };

    return {
      entity: session,
      events: [
        IdentityEvents.sessionCreated(session.sessionId, session.userId),
      ],
    };
  },

  /**
   * Reconstruct a Session entity from persisted data.
   */
  reconstruct: (data: _Session): _Session => data,

  /**
   * Check whether the session has expired.
   */
  isExpired: (session: _Session, now: Date): boolean => {
    return now >= session.expiresAt;
  },

  /**
   * Terminate the session immediately by setting expiresAt to now.
   */
  terminate: (session: _Session): WithEvents<_Session, SessionEvent> => {
    return {
      entity: {
        ...session,
        expiresAt: new Date(),
      },
      events: [
        IdentityEvents.sessionTerminated(session.sessionId, session.userId),
      ],
    };
  },
};
