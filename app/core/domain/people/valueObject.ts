import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { PeopleErrorCode } from "./errorCode";

// ============================================
// FileKey
// ============================================

type _FileKey = string & { readonly brand: "FileKey" };

export type FileKey = _FileKey;

export const FileKey = {
  create: (key: string): _FileKey => {
    if (key.length === 0) {
      throw new BusinessRuleError(
        PeopleErrorCode.EmptyFileKey,
        "File key cannot be empty",
      );
    }
    return key as _FileKey;
  },
};

// ============================================
// PostId
// ============================================

type _PostId = string & { readonly brand: "PostId" };

export type PostId = _PostId;

export const PostId = {
  create: (id: string): _PostId => {
    return id as _PostId;
  },
  generate: (): _PostId => {
    return uuidv7() as _PostId;
  },
};

// ============================================
// RichTextHtml
// ============================================

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
];

const SCRIPT_TAG_REGEX = /<script[\s>]/i;
const HTML_TAG_REGEX = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

type _RichTextHtml = string & { readonly brand: "RichTextHtml" };

export type RichTextHtml = _RichTextHtml;

export const RichTextHtml = {
  /**
   * Create a RichTextHtml value object.
   * Validates that the HTML does not contain disallowed tags.
   * Empty strings are allowed at this level; context-specific emptiness checks
   * (e.g., Post content must not be empty) are enforced by the entity.
   */
  create: (html: string): _RichTextHtml => {
    if (SCRIPT_TAG_REGEX.test(html)) {
      throw new BusinessRuleError(
        PeopleErrorCode.EmptyPostContent,
        "Rich text HTML must not contain script tags",
      );
    }

    let match: RegExpExecArray | null = HTML_TAG_REGEX.exec(html);
    while (match !== null) {
      const tagName = match[1].toLowerCase();
      if (!ALLOWED_TAGS.includes(tagName)) {
        throw new BusinessRuleError(
          PeopleErrorCode.EmptyPostContent,
          `Rich text HTML contains disallowed tag: <${tagName}>`,
        );
      }
      match = HTML_TAG_REGEX.exec(html);
    }

    return html as _RichTextHtml;
  },
  allowedTags: ALLOWED_TAGS,
};

// ============================================
// Mention
// ============================================

const MENTION_TYPES = ["user", "group", "organization"] as const;

type MentionType = (typeof MENTION_TYPES)[number];

type _Mention = Readonly<{
  type: MentionType;
  targetId: string;
}>;

export type Mention = _Mention;

export const Mention = {
  create: (params: { type: string; targetId: string }): _Mention => {
    if (!MENTION_TYPES.includes(params.type as MentionType)) {
      throw new BusinessRuleError(
        PeopleErrorCode.InvalidMentionType,
        `Invalid mention type: ${params.type}`,
      );
    }
    if (params.targetId.length === 0) {
      throw new BusinessRuleError(
        PeopleErrorCode.InvalidMentionTargetId,
        "Mention target ID cannot be empty",
      );
    }
    return {
      type: params.type as MentionType,
      targetId: params.targetId,
    };
  },
  equals: (a: _Mention, b: _Mention): boolean => {
    return a.type === b.type && a.targetId === b.targetId;
  },
  validTypes: MENTION_TYPES,
};
