import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { MessageErrorCode } from "./errorCode";

// ============================================
// FileKey
// ============================================

type _FileKey = string & { readonly brand: "FileKey" };

export type FileKey = _FileKey;

export const FileKey = {
  create: (key: string): _FileKey => {
    if (key.length === 0) {
      throw new BusinessRuleError(
        MessageErrorCode.EmptyFileKey,
        "File key cannot be empty",
      );
    }
    return key as _FileKey;
  },
};

// ============================================
// MessageThreadId
// ============================================

type _MessageThreadId = string & { readonly brand: "MessageThreadId" };

export type MessageThreadId = _MessageThreadId;

export const MessageThreadId = {
  create: (id: string): _MessageThreadId => {
    return id as _MessageThreadId;
  },
  generate: (): _MessageThreadId => {
    return uuidv7() as _MessageThreadId;
  },
};

// ============================================
// DirectMessageId
// ============================================

type _DirectMessageId = string & { readonly brand: "DirectMessageId" };

export type DirectMessageId = _DirectMessageId;

export const DirectMessageId = {
  create: (id: string): _DirectMessageId => {
    return id as _DirectMessageId;
  },
  generate: (): _DirectMessageId => {
    return uuidv7() as _DirectMessageId;
  },
};

// ============================================
// RichTextHtml
// ============================================

/**
 * Allowed HTML tags for rich text content.
 * App embedding elements (iframe, opendesk-app, etc.) are NOT allowed
 * in DirectMessage content.
 */
const ALLOWED_TAGS = [
  "b",
  "i",
  "u",
  "span",
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "div",
  "a",
  "img",
] as const;

/**
 * Pattern that matches disallowed HTML tags.
 * Detects any tag that is NOT in the allowed list.
 * Specifically targets app embedding elements: iframe, opendesk-app, script, object, embed.
 */
const DISALLOWED_TAG_PATTERN =
  /<\s*\/?\s*(iframe|opendesk-app|script|object|embed)[\s>]/i;

type _RichTextHtml = string & { readonly brand: "RichTextHtml" };

export type RichTextHtml = _RichTextHtml;

export const RichTextHtml = {
  /**
   * Create a RichTextHtml value object.
   * Validates that the content does not contain disallowed tags
   * (app embedding elements such as iframe, opendesk-app, script, object, embed).
   *
   * Note: Empty string validation is context-dependent and should be
   * checked by the caller when needed (e.g., DirectMessage content must not be empty).
   */
  create: (html: string): _RichTextHtml => {
    if (DISALLOWED_TAG_PATTERN.test(html)) {
      throw new BusinessRuleError(
        MessageErrorCode.InvalidRichTextHtml,
        "Rich text content contains disallowed elements (app embedding is not permitted)",
      );
    }
    return html as _RichTextHtml;
  },

  /**
   * List of allowed HTML tags for reference.
   */
  allowedTags: ALLOWED_TAGS,
};
