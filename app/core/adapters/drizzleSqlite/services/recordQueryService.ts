import { BusinessRuleError } from "@/core/domain/error";
import { RecordErrorCode } from "@/core/domain/record/errorCode";
import type { RecordQueryService } from "@/core/domain/record/services/recordQueryService";
import {
  FieldCode,
  type QueryExecutionContext,
  type RecordQuery,
  SortDirection,
  type SortSpec,
} from "@/core/domain/record/valueObject";

// ============================================
// Constants
// ============================================

const MAX_OFFSET = 10_000;
const MAX_LIMIT_MULTIPLE_RECORDS = 500;

// ============================================
// Token types for the lexer
// ============================================

const TokenType = {
  FieldCode: "FIELD_CODE",
  StringLiteral: "STRING_LITERAL",
  NumberLiteral: "NUMBER_LITERAL",
  Operator: "OPERATOR",
  LogicalOp: "LOGICAL_OP",
  Function: "FUNCTION",
  OpenParen: "OPEN_PAREN",
  CloseParen: "CLOSE_PAREN",
  Comma: "COMMA",
  OrderBy: "ORDER_BY",
  Limit: "LIMIT",
  Offset: "OFFSET",
  SortDirection: "SORT_DIRECTION",
  Is: "IS",
  Not: "NOT",
  In: "IN",
  Like: "LIKE",
  Empty: "EMPTY",
  EOF: "EOF",
} as const;

type TokenType = (typeof TokenType)[keyof typeof TokenType];

type Token = Readonly<{
  type: TokenType;
  value: string;
  position: number;
}>;

// ============================================
// Keywords and known functions
// ============================================

const KNOWN_FUNCTIONS = new Set([
  "LOGINUSER",
  "PRIMARY_ORGANIZATION",
  "NOW",
  "TODAY",
  "YESTERDAY",
  "TOMORROW",
  "FROM_TODAY",
  "THIS_WEEK",
  "LAST_WEEK",
  "NEXT_WEEK",
  "THIS_MONTH",
  "LAST_MONTH",
  "NEXT_MONTH",
  "THIS_YEAR",
  "LAST_YEAR",
  "NEXT_YEAR",
]);

const WEEKDAYS = new Set([
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]);

const FROM_TODAY_UNITS = new Set(["DAYS", "WEEKS", "MONTHS", "YEARS"]);

// ============================================
// Lexer
// ============================================

function tokenize(input: string): readonly Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  function skipWhitespace(): void {
    while (pos < input.length && /\s/.test(input[pos])) {
      pos++;
    }
  }

  function readStringLiteral(): string {
    const quote = input[pos];
    if (quote !== '"') {
      throw new BusinessRuleError(
        RecordErrorCode.QuerySyntaxError,
        `Expected opening quote at position ${pos}`,
      );
    }
    pos++; // skip opening quote
    let result = "";
    while (pos < input.length) {
      const ch = input[pos];
      if (ch === "\\") {
        pos++;
        if (pos >= input.length) {
          throw new BusinessRuleError(
            RecordErrorCode.QuerySyntaxError,
            `Unterminated escape sequence at position ${pos - 1}`,
          );
        }
        const escaped = input[pos];
        if (escaped === '"' || escaped === "\\") {
          result += escaped;
        } else {
          throw new BusinessRuleError(
            RecordErrorCode.QuerySyntaxError,
            `Invalid escape sequence "\\${escaped}" at position ${pos - 1}`,
          );
        }
      } else if (ch === '"') {
        pos++; // skip closing quote
        return result;
      } else {
        result += ch;
      }
      pos++;
    }
    throw new BusinessRuleError(
      RecordErrorCode.QuerySyntaxError,
      `Unterminated string literal starting at position ${pos}`,
    );
  }

  function readNumber(): string {
    const start = pos;
    if (input[pos] === "-") {
      pos++;
    }
    while (pos < input.length && /[0-9]/.test(input[pos])) {
      pos++;
    }
    if (pos < input.length && input[pos] === ".") {
      pos++;
      while (pos < input.length && /[0-9]/.test(input[pos])) {
        pos++;
      }
    }
    return input.slice(start, pos);
  }

  function readIdentifier(): string {
    const start = pos;
    while (
      pos < input.length &&
      /[a-zA-Z0-9_\u3000-\u9FFF\uF900-\uFAFF\u{20000}-\u{2FA1F}]/u.test(
        input[pos],
      )
    ) {
      pos++;
    }
    return input.slice(start, pos);
  }

  while (pos < input.length) {
    skipWhitespace();
    if (pos >= input.length) break;

    const startPos = pos;
    const ch = input[pos];

    // String literal
    if (ch === '"') {
      const value = readStringLiteral();
      tokens.push({ type: TokenType.StringLiteral, value, position: startPos });
      continue;
    }

    // Parentheses
    if (ch === "(") {
      tokens.push({
        type: TokenType.OpenParen,
        value: "(",
        position: startPos,
      });
      pos++;
      continue;
    }

    if (ch === ")") {
      tokens.push({
        type: TokenType.CloseParen,
        value: ")",
        position: startPos,
      });
      pos++;
      continue;
    }

    // Comma
    if (ch === ",") {
      tokens.push({ type: TokenType.Comma, value: ",", position: startPos });
      pos++;
      continue;
    }

    // Operators: >=, <=, !=, =, >, <
    if (ch === ">" || ch === "<" || ch === "!" || ch === "=") {
      if (pos + 1 < input.length && input[pos + 1] === "=") {
        tokens.push({
          type: TokenType.Operator,
          value: `${ch}=`,
          position: startPos,
        });
        pos += 2;
        continue;
      }
      if (ch === ">" || ch === "<" || ch === "=") {
        tokens.push({
          type: TokenType.Operator,
          value: ch,
          position: startPos,
        });
        pos++;
        continue;
      }
      // Standalone "!" is not valid
      throw new BusinessRuleError(
        RecordErrorCode.QuerySyntaxError,
        `Unexpected character "!" at position ${pos}`,
      );
    }

    // $id special identifier
    if (ch === "$") {
      pos++;
      const rest = readIdentifier();
      const id = `$${rest}`;
      tokens.push({ type: TokenType.FieldCode, value: id, position: startPos });
      continue;
    }

    // Number (starts with digit or '-' followed by digit)
    if (
      /[0-9]/.test(ch) ||
      (ch === "-" && pos + 1 < input.length && /[0-9]/.test(input[pos + 1]))
    ) {
      const value = readNumber();
      tokens.push({
        type: TokenType.NumberLiteral,
        value,
        position: startPos,
      });
      continue;
    }

    // Identifier / keyword / function
    if (
      /[a-zA-Z_\u3000-\u9FFF\uF900-\uFAFF]/u.test(ch) ||
      // Supplementary CJK
      (ch.codePointAt(0) !== undefined &&
        (ch.codePointAt(0) as number) >= 0x20000)
    ) {
      const ident = readIdentifier();
      const lower = ident.toLowerCase();

      // Check for "order by" (two-word keyword)
      if (lower === "order") {
        const savedPos = pos;
        skipWhitespace();
        if (pos < input.length) {
          const nextIdent = readIdentifier();
          if (nextIdent.toLowerCase() === "by") {
            tokens.push({
              type: TokenType.OrderBy,
              value: "order by",
              position: startPos,
            });
            continue;
          }
          // Not "by", revert
          pos = savedPos;
        }
      }

      // Check for "not in" or "not like" or "is not" (peek ahead)
      if (lower === "not") {
        const savedPos = pos;
        skipWhitespace();
        if (pos < input.length) {
          const nextIdent = readIdentifier();
          const nextLower = nextIdent.toLowerCase();
          if (nextLower === "in") {
            tokens.push({
              type: TokenType.Operator,
              value: "not in",
              position: startPos,
            });
            continue;
          }
          if (nextLower === "like") {
            tokens.push({
              type: TokenType.Operator,
              value: "not like",
              position: startPos,
            });
            continue;
          }
          // Revert - this "not" is part of "is not empty"
          pos = savedPos;
        }
        tokens.push({ type: TokenType.Not, value: "not", position: startPos });
        continue;
      }

      if (lower === "is") {
        tokens.push({ type: TokenType.Is, value: "is", position: startPos });
        continue;
      }

      if (lower === "empty") {
        tokens.push({
          type: TokenType.Empty,
          value: "empty",
          position: startPos,
        });
        continue;
      }

      if (lower === "in") {
        tokens.push({
          type: TokenType.Operator,
          value: "in",
          position: startPos,
        });
        continue;
      }

      if (lower === "like") {
        tokens.push({
          type: TokenType.Operator,
          value: "like",
          position: startPos,
        });
        continue;
      }

      if (lower === "and" || lower === "or") {
        tokens.push({
          type: TokenType.LogicalOp,
          value: lower,
          position: startPos,
        });
        continue;
      }

      if (lower === "limit") {
        tokens.push({
          type: TokenType.Limit,
          value: "limit",
          position: startPos,
        });
        continue;
      }

      if (lower === "offset") {
        tokens.push({
          type: TokenType.Offset,
          value: "offset",
          position: startPos,
        });
        continue;
      }

      if (lower === "asc" || lower === "desc") {
        tokens.push({
          type: TokenType.SortDirection,
          value: lower,
          position: startPos,
        });
        continue;
      }

      // Check if it's a known function (next char is '(')
      if (KNOWN_FUNCTIONS.has(ident)) {
        tokens.push({
          type: TokenType.Function,
          value: ident,
          position: startPos,
        });
        continue;
      }

      // Otherwise it's a field code
      tokens.push({
        type: TokenType.FieldCode,
        value: ident,
        position: startPos,
      });
      continue;
    }

    throw new BusinessRuleError(
      RecordErrorCode.QuerySyntaxError,
      `Unexpected character "${ch}" at position ${pos}`,
    );
  }

  tokens.push({ type: TokenType.EOF, value: "", position: pos });
  return tokens;
}

// ============================================
// Parser
// ============================================

type ParsedCondition = {
  readonly fieldCode: string;
  readonly operator: string;
  readonly value: ParsedValue;
};

type ParsedValue =
  | { readonly kind: "string"; readonly value: string }
  | { readonly kind: "number"; readonly value: string }
  | { readonly kind: "list"; readonly values: readonly ParsedValue[] }
  | {
      readonly kind: "function";
      readonly name: string;
      readonly args: readonly string[];
    };

type ParsedQuery = {
  readonly conditions: readonly ParsedConditionNode[];
  readonly orderBy: readonly SortSpec[];
  readonly limit: number | null;
  readonly offset: number | null;
};

type ParsedConditionNode =
  | { readonly type: "condition"; readonly condition: ParsedCondition }
  | {
      readonly type: "logical";
      readonly operator: "and" | "or";
      readonly left: ParsedConditionNode;
      readonly right: ParsedConditionNode;
    }
  | { readonly type: "group"; readonly inner: ParsedConditionNode };

class Parser {
  private pos = 0;
  private readonly tokens: readonly Token[];

  constructor(tokens: readonly Token[]) {
    this.tokens = tokens;
  }

  parse(): ParsedQuery {
    let conditions: ParsedConditionNode | null = null;

    // Parse conditions (if any exist before order by / limit / offset / EOF)
    if (!this.isAtOptionsOrEnd()) {
      conditions = this.parseExpression();
    }

    // Parse options
    const orderBy = this.parseOrderBy();
    const limit = this.parseLimit();
    const offset = this.parseOffset();

    // Ensure we consumed everything
    if (this.current().type !== TokenType.EOF) {
      throw new BusinessRuleError(
        RecordErrorCode.QuerySyntaxError,
        `Unexpected token "${this.current().value}" at position ${this.current().position}`,
      );
    }

    return {
      conditions: conditions ? [conditions] : [],
      orderBy,
      limit,
      offset,
    };
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  private expect(type: TokenType, hint?: string): Token {
    const tok = this.current();
    if (tok.type !== type) {
      throw new BusinessRuleError(
        RecordErrorCode.QuerySyntaxError,
        `Expected ${hint ?? type} but found "${tok.value}" at position ${tok.position}`,
      );
    }
    return this.advance();
  }

  private isAtOptionsOrEnd(): boolean {
    const t = this.current().type;
    return (
      t === TokenType.OrderBy ||
      t === TokenType.Limit ||
      t === TokenType.Offset ||
      t === TokenType.EOF
    );
  }

  private parseExpression(): ParsedConditionNode {
    let left = this.parsePrimary();

    while (this.current().type === TokenType.LogicalOp) {
      const op = this.advance().value as "and" | "or";
      const right = this.parsePrimary();
      left = { type: "logical", operator: op, left, right };
    }

    return left;
  }

  private parsePrimary(): ParsedConditionNode {
    // Grouping with parentheses: need to distinguish from function args / in-list
    // A group starts with '(' and the next token is a field code or another '('
    if (this.current().type === TokenType.OpenParen) {
      // Peek ahead to see if this is a grouped condition
      if (this.isGroupedCondition()) {
        this.advance(); // consume '('
        const inner = this.parseExpression();
        this.expect(TokenType.CloseParen, "closing parenthesis");
        return { type: "group", inner };
      }
    }

    return { type: "condition", condition: this.parseCondition() };
  }

  private isGroupedCondition(): boolean {
    // Look ahead from current '(' to determine if this is a group
    // A group has: ( field_code operator ... ) or ( ( ... ) ... )
    const next = this.tokens[this.pos + 1];
    if (!next) return false;
    return (
      next.type === TokenType.FieldCode || next.type === TokenType.OpenParen
    );
  }

  private parseCondition(): ParsedCondition {
    const fieldToken = this.expect(TokenType.FieldCode, "field code");
    const fieldCode = fieldToken.value;

    // Parse operator
    const operator = this.parseOperator();

    // Parse value based on operator
    const value = this.parseValue(operator);

    return { fieldCode, operator, value };
  }

  private parseOperator(): string {
    const tok = this.current();

    // Standard operators: =, !=, >, <, >=, <=, in, not in, like, not like
    if (tok.type === TokenType.Operator) {
      return this.advance().value;
    }

    // "is empty" or "is not empty"
    if (tok.type === TokenType.Is) {
      this.advance(); // consume "is"
      if (this.current().type === TokenType.Not) {
        this.advance(); // consume "not"
        this.expect(TokenType.Empty, "'empty'");
        return "is not empty";
      }
      this.expect(TokenType.Empty, "'empty'");
      return "is empty";
    }

    throw new BusinessRuleError(
      RecordErrorCode.QuerySyntaxError,
      `Expected operator but found "${tok.value}" at position ${tok.position}`,
    );
  }

  private parseValue(operator: string): ParsedValue {
    // "is empty" and "is not empty" have no value
    if (operator === "is empty" || operator === "is not empty") {
      return { kind: "string", value: "" };
    }

    // "in" and "not in" expect a parenthesized list
    if (operator === "in" || operator === "not in") {
      return this.parseList();
    }

    // Other operators expect a single value (string, number, or function)
    return this.parseSingleValue();
  }

  private parseList(): ParsedValue {
    this.expect(TokenType.OpenParen, "opening parenthesis for list");
    const values: ParsedValue[] = [];

    if (this.current().type !== TokenType.CloseParen) {
      values.push(this.parseSingleValue());
      while (this.current().type === TokenType.Comma) {
        this.advance(); // consume comma
        values.push(this.parseSingleValue());
      }
    }

    this.expect(TokenType.CloseParen, "closing parenthesis for list");
    return { kind: "list", values };
  }

  private parseSingleValue(): ParsedValue {
    const tok = this.current();

    if (tok.type === TokenType.StringLiteral) {
      this.advance();
      return { kind: "string", value: tok.value };
    }

    if (tok.type === TokenType.NumberLiteral) {
      this.advance();
      return { kind: "number", value: tok.value };
    }

    if (tok.type === TokenType.Function) {
      return this.parseFunctionCall();
    }

    // Some keywords like LAST can appear as function arguments
    if (tok.type === TokenType.FieldCode) {
      // Could be a bare identifier used as a function arg (e.g., DAYS, LAST, weekday names)
      this.advance();
      return { kind: "string", value: tok.value };
    }

    throw new BusinessRuleError(
      RecordErrorCode.QuerySyntaxError,
      `Expected value but found "${tok.value}" at position ${tok.position}`,
    );
  }

  private parseFunctionCall(): ParsedValue {
    const funcToken = this.advance(); // consume function name
    const funcName = funcToken.value;

    this.expect(TokenType.OpenParen, "opening parenthesis for function");
    const args: string[] = [];

    if (this.current().type !== TokenType.CloseParen) {
      args.push(this.parseFunctionArg());
      while (this.current().type === TokenType.Comma) {
        this.advance(); // consume comma
        args.push(this.parseFunctionArg());
      }
    }

    this.expect(TokenType.CloseParen, "closing parenthesis for function");

    // Validate function arguments
    validateFunctionArgs(funcName, args);

    return { kind: "function", name: funcName, args };
  }

  private parseFunctionArg(): string {
    const tok = this.current();
    if (
      tok.type === TokenType.NumberLiteral ||
      tok.type === TokenType.StringLiteral ||
      tok.type === TokenType.FieldCode ||
      tok.type === TokenType.Function
    ) {
      this.advance();
      return tok.value;
    }
    throw new BusinessRuleError(
      RecordErrorCode.QuerySyntaxError,
      `Expected function argument but found "${tok.value}" at position ${tok.position}`,
    );
  }

  private parseOrderBy(): readonly SortSpec[] {
    if (this.current().type !== TokenType.OrderBy) {
      return [];
    }
    this.advance(); // consume "order by"

    const specs: SortSpec[] = [];
    specs.push(this.parseSortSpec());

    while (this.current().type === TokenType.Comma) {
      this.advance(); // consume comma
      specs.push(this.parseSortSpec());
    }

    return specs;
  }

  private parseSortSpec(): SortSpec {
    const fieldToken = this.expect(TokenType.FieldCode, "field code for sort");
    const fieldCode = FieldCode.create(fieldToken.value);

    let direction = SortDirection.create("asc"); // default ascending
    if (this.current().type === TokenType.SortDirection) {
      direction = SortDirection.create(this.advance().value);
    }

    return { fieldCode, direction };
  }

  private parseLimit(): number | null {
    if (this.current().type !== TokenType.Limit) {
      return null;
    }
    this.advance(); // consume "limit"
    const numToken = this.expect(TokenType.NumberLiteral, "limit number");
    const value = Number.parseInt(numToken.value, 10);

    if (Number.isNaN(value) || value < 0) {
      throw new BusinessRuleError(
        RecordErrorCode.QueryValidationError,
        `Invalid limit value: ${numToken.value}`,
      );
    }

    return value;
  }

  private parseOffset(): number | null {
    if (this.current().type !== TokenType.Offset) {
      return null;
    }
    this.advance(); // consume "offset"
    const numToken = this.expect(TokenType.NumberLiteral, "offset number");
    const value = Number.parseInt(numToken.value, 10);

    if (Number.isNaN(value) || value < 0) {
      throw new BusinessRuleError(
        RecordErrorCode.QueryValidationError,
        `Invalid offset value: ${numToken.value}`,
      );
    }

    return value;
  }
}

// ============================================
// Function argument validation
// ============================================

function validateFunctionArgs(name: string, args: readonly string[]): void {
  switch (name) {
    case "LOGINUSER":
    case "PRIMARY_ORGANIZATION":
    case "NOW":
    case "TODAY":
    case "YESTERDAY":
    case "TOMORROW":
    case "THIS_YEAR":
    case "LAST_YEAR":
    case "NEXT_YEAR":
      if (args.length !== 0) {
        throw new BusinessRuleError(
          RecordErrorCode.QueryValidationError,
          `Function ${name}() does not accept arguments`,
        );
      }
      break;

    case "FROM_TODAY":
      if (args.length !== 2) {
        throw new BusinessRuleError(
          RecordErrorCode.QueryValidationError,
          "Function FROM_TODAY() requires exactly 2 arguments (number, unit)",
        );
      }
      if (!/^-?\d+$/.test(args[0])) {
        throw new BusinessRuleError(
          RecordErrorCode.QueryValidationError,
          `FROM_TODAY() first argument must be an integer, got "${args[0]}"`,
        );
      }
      if (!FROM_TODAY_UNITS.has(args[1])) {
        throw new BusinessRuleError(
          RecordErrorCode.QueryValidationError,
          `FROM_TODAY() second argument must be one of DAYS, WEEKS, MONTHS, YEARS, got "${args[1]}"`,
        );
      }
      break;

    case "THIS_WEEK":
    case "LAST_WEEK":
    case "NEXT_WEEK":
      if (args.length > 1) {
        throw new BusinessRuleError(
          RecordErrorCode.QueryValidationError,
          `Function ${name}() accepts at most 1 argument (weekday)`,
        );
      }
      if (args.length === 1 && !WEEKDAYS.has(args[0])) {
        throw new BusinessRuleError(
          RecordErrorCode.QueryValidationError,
          `${name}() argument must be a weekday (SUNDAY, MONDAY, ..., SATURDAY), got "${args[0]}"`,
        );
      }
      break;

    case "THIS_MONTH":
    case "LAST_MONTH":
    case "NEXT_MONTH":
      if (args.length > 1) {
        throw new BusinessRuleError(
          RecordErrorCode.QueryValidationError,
          `Function ${name}() accepts at most 1 argument (day number or LAST)`,
        );
      }
      if (args.length === 1) {
        const arg = args[0];
        if (arg !== "LAST" && !/^\d{1,2}$/.test(arg)) {
          throw new BusinessRuleError(
            RecordErrorCode.QueryValidationError,
            `${name}() argument must be LAST or a day number (1-31), got "${arg}"`,
          );
        }
        if (arg !== "LAST") {
          const day = Number.parseInt(arg, 10);
          if (day < 1 || day > 31) {
            throw new BusinessRuleError(
              RecordErrorCode.QueryValidationError,
              `${name}() day must be between 1 and 31, got ${day}`,
            );
          }
        }
      }
      break;

    default:
      throw new BusinessRuleError(
        RecordErrorCode.QueryValidationError,
        `Unknown function: ${name}()`,
      );
  }
}

// ============================================
// Query validation
// ============================================

function validateQuery(parsed: ParsedQuery): void {
  // Validate offset limit
  if (parsed.offset !== null && parsed.offset > MAX_OFFSET) {
    throw new BusinessRuleError(
      RecordErrorCode.QueryValidationError,
      `Offset must not exceed ${MAX_OFFSET}, got ${parsed.offset}`,
    );
  }

  // Validate limit (use the more permissive limit for multiple record retrieval)
  if (parsed.limit !== null && parsed.limit > MAX_LIMIT_MULTIPLE_RECORDS) {
    throw new BusinessRuleError(
      RecordErrorCode.QueryValidationError,
      `Limit must not exceed ${MAX_LIMIT_MULTIPLE_RECORDS}, got ${parsed.limit}`,
    );
  }
}

// ============================================
// Function resolution helpers
// ============================================

const WEEKDAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDatetime(d: Date): string {
  return d.toISOString();
}

function getStartOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function getWeekday(d: Date, weekday: string | undefined): Date {
  const base = getStartOfDay(d);
  if (weekday === undefined) {
    return base;
  }
  const targetDay = WEEKDAY_INDEX[weekday];
  const currentDay = base.getDay();
  const diff = targetDay - currentDay;
  return addDays(base, diff);
}

function getStartOfWeek(d: Date): Date {
  const base = getStartOfDay(d);
  const dayOfWeek = base.getDay();
  return addDays(base, -dayOfWeek);
}

function getMonthDate(
  year: number,
  month: number,
  dayArg: string | undefined,
): Date {
  if (dayArg === undefined) {
    return new Date(year, month, 1);
  }
  if (dayArg === "LAST") {
    // Last day of month: day 0 of next month = last day of current month
    return new Date(year, month + 1, 0);
  }
  const day = Number.parseInt(dayArg, 10);
  // If the day exceeds the month's days, Date constructor naturally overflows to next month
  return new Date(year, month, day);
}

function resolveFunction(
  funcName: string,
  funcArgs: readonly string[],
  context: QueryExecutionContext,
): string | null {
  const now = context.now;
  const today = getStartOfDay(now);

  switch (funcName) {
    case "LOGINUSER":
      return context.loginUserCode;

    case "PRIMARY_ORGANIZATION":
      // Returns null if primary organization is not set (condition is ignored)
      return context.primaryOrganizationCode;

    case "NOW":
      return formatDatetime(now);

    case "TODAY":
      return formatDate(today);

    case "YESTERDAY":
      return formatDate(addDays(today, -1));

    case "TOMORROW":
      return formatDate(addDays(today, 1));

    case "FROM_TODAY": {
      const amount = Number.parseInt(funcArgs[0], 10);
      const unit = funcArgs[1];
      const base = new Date(today);
      switch (unit) {
        case "DAYS":
          base.setDate(base.getDate() + amount);
          break;
        case "WEEKS":
          base.setDate(base.getDate() + amount * 7);
          break;
        case "MONTHS":
          base.setMonth(base.getMonth() + amount);
          break;
        case "YEARS":
          base.setFullYear(base.getFullYear() + amount);
          break;
      }
      return formatDate(base);
    }

    case "THIS_WEEK": {
      const weekStart = getStartOfWeek(today);
      return formatDate(getWeekday(weekStart, funcArgs[0]));
    }

    case "LAST_WEEK": {
      const lastWeekStart = addDays(getStartOfWeek(today), -7);
      return formatDate(getWeekday(lastWeekStart, funcArgs[0]));
    }

    case "NEXT_WEEK": {
      const nextWeekStart = addDays(getStartOfWeek(today), 7);
      return formatDate(getWeekday(nextWeekStart, funcArgs[0]));
    }

    case "THIS_MONTH": {
      return formatDate(
        getMonthDate(today.getFullYear(), today.getMonth(), funcArgs[0]),
      );
    }

    case "LAST_MONTH": {
      const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return formatDate(
        getMonthDate(d.getFullYear(), d.getMonth(), funcArgs[0]),
      );
    }

    case "NEXT_MONTH": {
      const d = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return formatDate(
        getMonthDate(d.getFullYear(), d.getMonth(), funcArgs[0]),
      );
    }

    case "THIS_YEAR":
      return formatDate(new Date(today.getFullYear(), 0, 1));

    case "LAST_YEAR":
      return formatDate(new Date(today.getFullYear() - 1, 0, 1));

    case "NEXT_YEAR":
      return formatDate(new Date(today.getFullYear() + 1, 0, 1));

    default:
      return null;
  }
}

// ============================================
// Condition string reconstruction
// ============================================

function conditionNodeToString(node: ParsedConditionNode): string {
  switch (node.type) {
    case "condition": {
      const c = node.condition;
      if (c.operator === "is empty" || c.operator === "is not empty") {
        return `${c.fieldCode} ${c.operator}`;
      }
      return `${c.fieldCode} ${c.operator} ${valueToString(c.value)}`;
    }
    case "logical":
      return `${conditionNodeToString(node.left)} ${node.operator} ${conditionNodeToString(node.right)}`;
    case "group":
      return `(${conditionNodeToString(node.inner)})`;
  }
}

function valueToString(value: ParsedValue): string {
  switch (value.kind) {
    case "string":
      return `"${escapeString(value.value)}"`;
    case "number":
      return value.value;
    case "list":
      return `(${value.values.map(valueToString).join(", ")})`;
    case "function":
      if (value.args.length === 0) {
        return `${value.name}()`;
      }
      return `${value.name}(${value.args.join(", ")})`;
  }
}

function escapeString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ============================================
// Function resolution in parsed conditions
// ============================================

function resolveConditionFunctions(
  node: ParsedConditionNode,
  context: QueryExecutionContext,
): ParsedConditionNode | null {
  switch (node.type) {
    case "condition": {
      const resolved = resolveValueFunctions(node.condition.value, context);
      if (resolved === null) {
        // PRIMARY_ORGANIZATION() returned null, skip this condition
        return null;
      }
      return {
        type: "condition",
        condition: {
          ...node.condition,
          value: resolved,
        },
      };
    }
    case "logical": {
      const left = resolveConditionFunctions(node.left, context);
      const right = resolveConditionFunctions(node.right, context);
      if (left === null && right === null) return null;
      if (left === null) return right;
      if (right === null) return left;
      return { type: "logical", operator: node.operator, left, right };
    }
    case "group": {
      const inner = resolveConditionFunctions(node.inner, context);
      if (inner === null) return null;
      return { type: "group", inner };
    }
  }
}

function resolveValueFunctions(
  value: ParsedValue,
  context: QueryExecutionContext,
): ParsedValue | null {
  switch (value.kind) {
    case "string":
    case "number":
      return value;
    case "function": {
      const resolved = resolveFunction(value.name, value.args, context);
      if (resolved === null) {
        // PRIMARY_ORGANIZATION() with no org set => condition ignored
        return null;
      }
      return { kind: "string", value: resolved };
    }
    case "list": {
      const resolvedValues: ParsedValue[] = [];
      for (const v of value.values) {
        const r = resolveValueFunctions(v, context);
        if (r === null) {
          // If any list item resolves to null, skip entire condition
          return null;
        }
        resolvedValues.push(r);
      }
      return { kind: "list", values: resolvedValues };
    }
  }
}

// ============================================
// Build RecordQuery from parsed data
// ============================================

function buildConditionString(
  conditions: readonly ParsedConditionNode[],
): string | null {
  if (conditions.length === 0) return null;
  return conditions.map(conditionNodeToString).join(" and ");
}

function buildRecordQuery(parsed: ParsedQuery): RecordQuery {
  return {
    condition: buildConditionString(parsed.conditions),
    orderBy: parsed.orderBy,
    limit: parsed.limit,
    offset: parsed.offset,
  };
}

// ============================================
// DrizzleSqliteRecordQueryService
// ============================================

export class DrizzleSqliteRecordQueryService implements RecordQueryService {
  parseAndValidate(queryString: string): RecordQuery {
    if (queryString.trim() === "") {
      return {
        condition: null,
        orderBy: [],
        limit: null,
        offset: null,
      };
    }

    const tokens = tokenize(queryString);
    const parser = new Parser(tokens);
    const parsed = parser.parse();

    validateQuery(parsed);

    return buildRecordQuery(parsed);
  }

  resolveFunctions(
    query: RecordQuery,
    context: QueryExecutionContext,
  ): RecordQuery {
    if (query.condition === null) {
      return query;
    }

    // Re-parse the condition to get the AST, resolve functions, then rebuild
    const tokens = tokenize(query.condition);
    const parser = new Parser(tokens);
    const parsed = parser.parse();

    const resolvedConditions: ParsedConditionNode[] = [];
    for (const node of parsed.conditions) {
      const resolved = resolveConditionFunctions(node, context);
      if (resolved !== null) {
        resolvedConditions.push(resolved);
      }
    }

    const resolvedCondition = buildConditionString(resolvedConditions);

    return {
      ...query,
      condition: resolvedCondition,
    };
  }
}
