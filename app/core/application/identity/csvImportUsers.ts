import {
  ConflictError,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { BusinessRuleError } from "@/core/domain/error";
import { User } from "@/core/domain/identity/entity";
import {
  Email,
  Language,
  LoginName,
  Timezone,
} from "@/core/domain/identity/valueObject";
import type { CsvImportUsersOutput } from "./dto";

export type CsvImportUsersInput = {
  readonly csvContent: string;
  readonly encoding: "utf-8" | "shift-jis";
  readonly hasHeader: boolean;
};

/**
 * Parse a CSV line respecting quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }

  fields.push(current);
  return fields;
}

/**
 * Parse a boolean-like string.
 */
function parseIsActive(value: string): boolean {
  const lower = value.trim().toLowerCase();
  if (lower === "1" || lower === "true" || lower === "yes") {
    return true;
  }
  if (lower === "0" || lower === "false" || lower === "no") {
    return false;
  }
  return true;
}

/**
 * Import users from CSV content.
 *
 * CSV columns: loginName, displayName, email, timezone, language, isActive
 */
export async function csvImportUsers({
  container,
  input,
}: ServiceArgs<CsvImportUsersInput>): Promise<CsvImportUsersOutput> {
  if (input.csvContent.trim().length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "CSV content is empty",
    );
  }

  const lines = input.csvContent
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  const dataLines = input.hasHeader ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "CSV file contains no data rows",
    );
  }

  let importedCount = 0;
  let skippedCount = 0;
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < dataLines.length; i++) {
    const rowNumber = input.hasHeader ? i + 2 : i + 1;
    const line = dataLines[i];
    const fields = parseCsvLine(line);

    if (fields.length < 3) {
      errors.push({
        row: rowNumber,
        message:
          "Insufficient columns. Expected at least: loginName, displayName, email",
      });
      skippedCount++;
      continue;
    }

    const loginNameRaw = fields[0].trim();
    const displayNameRaw = fields[1].trim();
    const emailRaw = fields[2].trim();
    const timezoneRaw = fields.length > 3 ? fields[3].trim() : "";
    const languageRaw = fields.length > 4 ? fields[4].trim() : "";
    const isActiveRaw = fields.length > 5 ? fields[5].trim() : "true";

    try {
      const loginName = LoginName.create(loginNameRaw);
      const email = Email.create(emailRaw);
      const timezone =
        timezoneRaw.length > 0
          ? Timezone.create(timezoneRaw)
          : Timezone.default();
      const language =
        languageRaw.length > 0
          ? Language.create(languageRaw)
          : Language.default();
      const isActive = parseIsActive(isActiveRaw);

      if (displayNameRaw.length === 0) {
        errors.push({ row: rowNumber, message: "Display name is empty" });
        skippedCount++;
        continue;
      }

      const existingByLoginName =
        await container.unitOfWorkProvider.transaction(async (ctx) => {
          return ctx.userRepository.findByLoginName(loginName);
        });

      if (existingByLoginName) {
        errors.push({
          row: rowNumber,
          message: `Login name '${loginNameRaw}' is already in use`,
        });
        skippedCount++;
        continue;
      }

      const existingByEmail = await container.unitOfWorkProvider.transaction(
        async (ctx) => {
          return ctx.userRepository.findByEmail(email);
        },
      );

      if (existingByEmail) {
        errors.push({
          row: rowNumber,
          message: `Email '${emailRaw}' is already in use`,
        });
        skippedCount++;
        continue;
      }

      const { entity: user } = User.create({
        loginName,
        displayName: displayNameRaw,
        email,
        timezone,
        language,
      });

      const finalUser = isActive
        ? user
        : {
            ...user,
            isActive: false,
          };

      await container.unitOfWorkProvider.transaction(async (ctx) => {
        await ctx.userRepository.save(finalUser);
      });

      importedCount++;
    } catch (error) {
      if (
        error instanceof BusinessRuleError ||
        error instanceof ConflictError
      ) {
        errors.push({ row: rowNumber, message: error.message });
      } else if (error instanceof Error) {
        errors.push({ row: rowNumber, message: error.message });
      } else {
        errors.push({ row: rowNumber, message: "Unknown error" });
      }
      skippedCount++;
    }
  }

  return {
    importedCount,
    skippedCount,
    errors,
  };
}
