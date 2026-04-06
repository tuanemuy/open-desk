import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { PortalErrorCode } from "./errorCode";

// ============================================
// FileKey
// ============================================

type _FileKey = string & { readonly brand: "FileKey" };

export type FileKey = _FileKey;

export const FileKey = {
  create: (key: string): _FileKey => {
    if (key.length === 0) {
      throw new BusinessRuleError(
        PortalErrorCode.EmptyFileKey,
        "File key cannot be empty",
      );
    }
    return key as _FileKey;
  },
};

// ============================================
// AnnouncementId
// ============================================

type _AnnouncementId = string & { readonly brand: "AnnouncementId" };

export type AnnouncementId = _AnnouncementId;

export const AnnouncementId = {
  create: (id: string): _AnnouncementId => {
    return id as _AnnouncementId;
  },
  generate: (): _AnnouncementId => {
    return uuidv7() as _AnnouncementId;
  },
};

// ============================================
// RichTextHtml
// ============================================

/**
 * Allowed HTML tags for rich text content.
 * - Text formatting: b, i, u, span (with style: color, background-color, font-size)
 * - Structure: p, br, ul, ol, li, div
 * - Links: a (href, target attributes)
 * - Images: img (src, alt, width, height attributes)
 * - Embeds: custom elements for app list/graph embedding
 *
 * Empty string is allowed (no body content).
 */
type _RichTextHtml = string & { readonly brand: "RichTextHtml" };

export type RichTextHtml = _RichTextHtml;

export const RichTextHtml = {
  create: (value: string): _RichTextHtml => {
    return value as _RichTextHtml;
  },
};

// ============================================
// SpaceWidgetDisplayMode
// ============================================

export type SpaceWidgetDisplayMode =
  | "joined"
  | "favorite"
  | "recent"
  | "created"
  | "all"
  | "guest_joined";

// ============================================
// AppWidgetDisplayMode
// ============================================

export type AppWidgetDisplayMode =
  | "all"
  | "favorite"
  | "recent"
  | "created"
  | "recently_published";

// ============================================
// NotificationFilterMode
// ============================================

export type NotificationFilterMode =
  | "all"
  | "for_me"
  | "read_later"
  | { readonly customFilterId: string };
