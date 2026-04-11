import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { FilterCondEvaluator } from "@/core/domain/access-control/ports/filterCondEvaluator";
import type { FieldValue as FieldValueType } from "@/core/domain/access-control/valueObject";
import type { FieldCode as FieldCodeType } from "@/core/domain/app/valueObject";

// ============================================
// Token types for the query lexer
// ============================================

type TokenType =
  | "FIELD_CODE"
  | "STRING"
  | "NUMBER"
  | "OPERATOR"
  | "LOGICAL"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "KEYWORD"
  | "FUNCTION"
  | "EOF";

type Token = Readonly<{
  type: TokenType;
  value: string;
}>;

// ============================================
// AST node types
// ============================================

type AstNode = ComparisonNode | LogicalNode;

type ComparisonNode = Readonly<{
  kind: "comparison";
  fieldCode: string;
  operator: string;
  values: readonly string[];
}>;

type LogicalNode = Readonly<{
  kind: "logical";
  operator: "and" | "or";
  left: AstNode;
  right: AstNode;
}>;

// ============================================
// Lexer
// ============================================

const OPERATORS = ["!=", ">=", "<=", "=", ">", "<"] as const;

const ORDER_BY_KEYWORDS = ["order", "limit", "offset"] as const;

function tokenize(input: string): readonly Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  const peek = (offset = 0): string => input[pos + offset] ?? "";
  const advance = (): string => input[pos++] ?? "";
  const isEnd = (): boolean => pos >= input.length;

  const skipWhitespace = (): void => {
    while (!isEnd() && /\s/.test(peek())) {
      advance();
    }
  };

  const readString = (): string => {
    // Skip opening quote
    advance();
    let result = "";
    while (!isEnd()) {
      const ch = advance();
      if (ch === "\\") {
        const next = advance();
        if (next === '"') {
          result += '"';
        } else if (next === "\\") {
          result += "\\";
        } else {
          result += `\\${next}`;
        }
      } else if (ch === '"') {
        return result;
      } else {
        result += ch;
      }
    }
    throw new SystemError(
      SystemErrorCode.InternalServerError,
      "Unterminated string literal in filter condition",
    );
  };

  const readNumber = (): string => {
    let result = "";
    if (peek() === "-") {
      result += advance();
    }
    while (!isEnd() && /[0-9.]/.test(peek())) {
      result += advance();
    }
    return result;
  };

  const readIdentifier = (): string => {
    let result = "";
    while (!isEnd() && /[^\s(),="'<>!]/.test(peek())) {
      result += advance();
    }
    return result;
  };

  const lookAheadWord = (): string => {
    let tempPos = pos;
    while (tempPos < input.length && /\s/.test(input[tempPos] ?? "")) {
      tempPos++;
    }
    let word = "";
    while (
      tempPos < input.length &&
      /[^\s(),="'<>!]/.test(input[tempPos] ?? "")
    ) {
      word += input[tempPos];
      tempPos++;
    }
    return word.toLowerCase();
  };

  while (!isEnd()) {
    skipWhitespace();
    if (isEnd()) break;

    const ch = peek();

    // String literals
    if (ch === '"') {
      tokens.push({ type: "STRING", value: readString() });
      continue;
    }

    // Parentheses
    if (ch === "(") {
      tokens.push({ type: "LPAREN", value: advance() });
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "RPAREN", value: advance() });
      continue;
    }

    // Comma
    if (ch === ",") {
      tokens.push({ type: "COMMA", value: advance() });
      continue;
    }

    // Two-character operators
    const twoChar = `${peek()}${peek(1)}`;
    const matchedOp = OPERATORS.find((op) => twoChar.startsWith(op));
    if (matchedOp && matchedOp.length === 2) {
      advance();
      advance();
      tokens.push({ type: "OPERATOR", value: matchedOp });
      continue;
    }

    // Single-character operators
    if (ch === "=" || ch === ">" || ch === "<") {
      tokens.push({ type: "OPERATOR", value: advance() });
      continue;
    }
    if (ch === "!" && peek(1) === "=") {
      advance();
      advance();
      tokens.push({ type: "OPERATOR", value: "!=" });
      continue;
    }

    // Numbers (including negative numbers, but only if not part of identifier)
    if (/[0-9]/.test(ch) || (ch === "-" && /[0-9]/.test(peek(1)))) {
      tokens.push({ type: "NUMBER", value: readNumber() });
      continue;
    }

    // Identifiers, keywords, and multi-word operators
    const ident = readIdentifier();
    if (ident.length === 0) {
      // Skip unknown character
      advance();
      continue;
    }

    const lower = ident.toLowerCase();

    // Check for "not in", "not like", "is empty", "is not empty"
    if (lower === "not") {
      const nextWord = lookAheadWord();
      if (nextWord === "in" || nextWord === "like") {
        skipWhitespace();
        readIdentifier();
        tokens.push({ type: "OPERATOR", value: `not ${nextWord}` });
        continue;
      }
    }

    if (lower === "is") {
      const nextWord = lookAheadWord();
      if (nextWord === "empty") {
        skipWhitespace();
        readIdentifier();
        tokens.push({ type: "OPERATOR", value: "is empty" });
        continue;
      }
      if (nextWord === "not") {
        // Check for "is not empty"
        let tempPos = pos;
        while (tempPos < input.length && /\s/.test(input[tempPos] ?? ""))
          tempPos++;
        let w1 = "";
        while (
          tempPos < input.length &&
          /[^\s(),="'<>!]/.test(input[tempPos] ?? "")
        ) {
          w1 += input[tempPos];
          tempPos++;
        }
        while (tempPos < input.length && /\s/.test(input[tempPos] ?? ""))
          tempPos++;
        let w2 = "";
        while (
          tempPos < input.length &&
          /[^\s(),="'<>!]/.test(input[tempPos] ?? "")
        ) {
          w2 += input[tempPos];
          tempPos++;
        }
        if (w1.toLowerCase() === "not" && w2.toLowerCase() === "empty") {
          pos = tempPos;
          tokens.push({ type: "OPERATOR", value: "is not empty" });
          continue;
        }
      }
    }

    if (lower === "in") {
      tokens.push({ type: "OPERATOR", value: "in" });
      continue;
    }

    if (lower === "like") {
      tokens.push({ type: "OPERATOR", value: "like" });
      continue;
    }

    // Logical operators
    if (lower === "and" || lower === "or") {
      tokens.push({ type: "LOGICAL", value: lower });
      continue;
    }

    // Stop at order by / limit / offset (options portion, not part of filter condition)
    if (
      ORDER_BY_KEYWORDS.includes(lower as (typeof ORDER_BY_KEYWORDS)[number])
    ) {
      // We've reached the options portion; stop tokenizing the condition part
      break;
    }

    // Function calls like LOGINUSER(), NOW(), TODAY(), etc.
    // Check if next non-whitespace char is '('
    const savedPos = pos;
    skipWhitespace();
    if (!isEnd() && peek() === "(") {
      // This is a function call - read through the closing paren
      let funcContent = `${ident}(`;
      advance(); // consume '('
      let depth = 1;
      while (!isEnd() && depth > 0) {
        const c = advance();
        funcContent += c;
        if (c === "(") depth++;
        if (c === ")") depth--;
      }
      tokens.push({ type: "FUNCTION", value: funcContent });
      continue;
    }
    pos = savedPos;

    // Regular field code or identifier
    tokens.push({ type: "FIELD_CODE", value: ident });
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

// ============================================
// Parser (recursive descent)
// ============================================

function parse(tokens: readonly Token[]): AstNode | null {
  let pos = 0;

  const current = (): Token => tokens[pos] ?? { type: "EOF", value: "" };
  const advance = (): Token => {
    const tok = current();
    pos++;
    return tok;
  };
  const expect = (type: TokenType): Token => {
    const tok = current();
    if (tok.type !== type) {
      throw new SystemError(
        SystemErrorCode.InternalServerError,
        `Expected token type ${type} but got ${tok.type} ("${tok.value}") in filter condition`,
      );
    }
    return advance();
  };

  // Grammar:
  // expression  = orExpr
  // orExpr      = andExpr ("or" andExpr)*
  // andExpr     = primary ("and" primary)*
  // primary     = "(" expression ")" | comparison

  const parseExpression = (): AstNode => {
    return parseOrExpr();
  };

  const parseOrExpr = (): AstNode => {
    let left = parseAndExpr();
    while (current().type === "LOGICAL" && current().value === "or") {
      advance(); // consume "or"
      const right = parseAndExpr();
      left = { kind: "logical", operator: "or", left, right };
    }
    return left;
  };

  const parseAndExpr = (): AstNode => {
    let left = parsePrimary();
    while (current().type === "LOGICAL" && current().value === "and") {
      advance(); // consume "and"
      const right = parsePrimary();
      left = { kind: "logical", operator: "and", left, right };
    }
    return left;
  };

  const parsePrimary = (): AstNode => {
    if (current().type === "LPAREN") {
      advance(); // consume "("
      const node = parseExpression();
      expect("RPAREN");
      return node;
    }
    return parseComparison();
  };

  const parseComparison = (): ComparisonNode => {
    const fieldToken = advance();
    const fieldCode =
      fieldToken.type === "FIELD_CODE" || fieldToken.type === "STRING"
        ? fieldToken.value
        : fieldToken.value;

    const opToken = expect("OPERATOR");
    const operator = opToken.value;

    // "is empty" and "is not empty" have no value operand
    if (operator === "is empty" || operator === "is not empty") {
      return { kind: "comparison", fieldCode, operator, values: [] };
    }

    // "in" and "not in" expect a parenthesized list
    if (operator === "in" || operator === "not in") {
      const values = parseValueList();
      return { kind: "comparison", fieldCode, operator, values };
    }

    // Other operators expect a single value
    const valueToken = advance();
    const value =
      valueToken.type === "STRING" ||
      valueToken.type === "NUMBER" ||
      valueToken.type === "FUNCTION"
        ? valueToken.value
        : valueToken.value;

    return { kind: "comparison", fieldCode, operator, values: [value] };
  };

  const parseValueList = (): readonly string[] => {
    expect("LPAREN");
    const values: string[] = [];
    if (current().type !== "RPAREN") {
      const first = advance();
      values.push(first.value);
      while (current().type === "COMMA") {
        advance(); // consume ","
        const next = advance();
        values.push(next.value);
      }
    }
    expect("RPAREN");
    return values;
  };

  if (current().type === "EOF") {
    return null;
  }

  return parseExpression();
}

// ============================================
// Evaluator
// ============================================

/**
 * Extract a comparable string value from a FieldValue for comparison operations.
 */
function extractStringValue(fieldValue: FieldValueType): string | null {
  const { type, value } = fieldValue;

  if (value === null || value === undefined) {
    return null;
  }

  switch (type) {
    case "SINGLE_LINE_TEXT":
    case "MULTI_LINE_TEXT":
    case "RICH_TEXT":
    case "NUMBER":
    case "CALC":
    case "RADIO_BUTTON":
    case "DROP_DOWN":
    case "DATE":
    case "TIME":
    case "DATETIME":
    case "LINK":
    case "RECORD_NUMBER":
    case "STATUS":
    case "CREATED_TIME":
    case "UPDATED_TIME":
    case "__ID__":
    case "__REVISION__":
      return String(value);
    case "CREATOR":
    case "MODIFIER": {
      const ref = value as { code: string };
      return ref.code;
    }
    default:
      return String(value);
  }
}

/**
 * Extract all comparable string values from a FieldValue (for multi-value fields).
 */
function extractStringValues(fieldValue: FieldValueType): readonly string[] {
  const { type, value } = fieldValue;

  if (value === null || value === undefined) {
    return [];
  }

  switch (type) {
    case "CHECK_BOX":
    case "MULTI_SELECT":
    case "CATEGORY":
      return value as readonly string[];
    case "USER_SELECT":
    case "STATUS_ASSIGNEE": {
      const refs = value as readonly { code: string }[];
      return refs.map((r) => r.code);
    }
    case "ORGANIZATION_SELECT": {
      const refs = value as readonly { code: string }[];
      return refs.map((r) => r.code);
    }
    case "GROUP_SELECT": {
      const refs = value as readonly { code: string }[];
      return refs.map((r) => r.code);
    }
    case "CREATOR":
    case "MODIFIER": {
      const ref = value as { code: string };
      return [ref.code];
    }
    case "LOOKUP": {
      if (Array.isArray(value)) {
        return value as readonly string[];
      }
      return [String(value)];
    }
    default: {
      const str = extractStringValue(fieldValue);
      return str !== null ? [str] : [];
    }
  }
}

/**
 * Check whether a FieldValue is considered "empty" according to query semantics.
 * Empty means: null, undefined, empty string, whitespace-only, or empty array.
 */
function isFieldEmpty(fieldValue: FieldValueType | undefined): boolean {
  if (fieldValue === undefined) {
    return true;
  }

  const { value } = fieldValue;

  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

/**
 * Compare two values numerically if both are numeric, otherwise lexicographically.
 */
function compareValues(a: string, b: string): number {
  const numA = Number(a);
  const numB = Number(b);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Evaluate a single comparison node against field values.
 */
function evaluateComparison(
  node: ComparisonNode,
  fieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
): boolean {
  const { fieldCode, operator, values } = node;

  // Handle $id special field
  const fieldValue = fieldValues.get(fieldCode as FieldCodeType);

  // "is empty" / "is not empty" operators
  if (operator === "is empty") {
    return isFieldEmpty(fieldValue);
  }
  if (operator === "is not empty") {
    return !isFieldEmpty(fieldValue);
  }

  // If field is not found, the comparison cannot match
  if (fieldValue === undefined) {
    return false;
  }

  // "in" / "not in" operators - check if any field value matches any operand value
  if (operator === "in") {
    const fieldVals = extractStringValues(fieldValue);
    return fieldVals.some((fv) => values.includes(fv));
  }
  if (operator === "not in") {
    const fieldVals = extractStringValues(fieldValue);
    // If field has no values, it does not match any listed value => not in is true
    if (fieldVals.length === 0) {
      return true;
    }
    return fieldVals.every((fv) => !values.includes(fv));
  }

  // Single-value operators
  const fieldStr = extractStringValue(fieldValue);
  if (fieldStr === null) {
    return false;
  }

  const operandValue = values[0] ?? "";

  switch (operator) {
    case "=":
      return fieldStr === operandValue;
    case "!=":
      return fieldStr !== operandValue;
    case ">":
      return compareValues(fieldStr, operandValue) > 0;
    case "<":
      return compareValues(fieldStr, operandValue) < 0;
    case ">=":
      return compareValues(fieldStr, operandValue) >= 0;
    case "<=":
      return compareValues(fieldStr, operandValue) <= 0;
    case "like":
      return fieldStr.includes(operandValue);
    case "not like":
      return !fieldStr.includes(operandValue);
    default:
      throw new SystemError(
        SystemErrorCode.InternalServerError,
        `Unsupported operator in filter condition: ${operator}`,
      );
  }
}

/**
 * Evaluate an AST node against field values.
 */
function evaluateNode(
  node: AstNode,
  fieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
): boolean {
  switch (node.kind) {
    case "comparison":
      return evaluateComparison(node, fieldValues);
    case "logical":
      if (node.operator === "and") {
        return (
          evaluateNode(node.left, fieldValues) &&
          evaluateNode(node.right, fieldValues)
        );
      }
      return (
        evaluateNode(node.left, fieldValues) ||
        evaluateNode(node.right, fieldValues)
      );
  }
}

// ============================================
// DrizzleSqliteFilterCondEvaluator
// ============================================

export class DrizzleSqliteFilterCondEvaluator implements FilterCondEvaluator {
  evaluate(
    filterCond: string | null,
    fieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
  ): boolean {
    // null condition matches all records
    if (filterCond === null) {
      return true;
    }

    const trimmed = filterCond.trim();
    if (trimmed.length === 0) {
      return true;
    }

    try {
      const tokens = tokenize(trimmed);
      const ast = parse(tokens);

      // If parsing produces no AST (e.g. only options like "order by ..."), match all
      if (ast === null) {
        return true;
      }

      return evaluateNode(ast, fieldValues);
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.InternalServerError,
        `Failed to evaluate filter condition: ${filterCond}`,
        error,
      );
    }
  }
}
