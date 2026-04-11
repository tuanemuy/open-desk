import {
  ConflictError,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { BusinessRuleError } from "@/core/domain/error";
import { Group } from "@/core/domain/identity/entity";
import type { CsvImportGroupsOutput } from "./dto";

export type CsvImportGroupsInput = {
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
 * Import groups from CSV content.
 *
 * CSV columns: code, name
 */
export async function csvImportGroups({
  container,
  input,
}: ServiceArgs<CsvImportGroupsInput>): Promise<CsvImportGroupsOutput> {
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

    if (fields.length < 2) {
      errors.push({
        row: rowNumber,
        message: "Insufficient columns. Expected at least: code, name",
      });
      skippedCount++;
      continue;
    }

    const codeRaw = fields[0].trim();
    const nameRaw = fields[1].trim();

    try {
      if (codeRaw.length === 0) {
        errors.push({ row: rowNumber, message: "Group code is empty" });
        skippedCount++;
        continue;
      }

      if (nameRaw.length === 0) {
        errors.push({ row: rowNumber, message: "Group name is empty" });
        skippedCount++;
        continue;
      }

      const existingByCode = await container.unitOfWorkProvider.transaction(
        async (ctx) => {
          return ctx.groupRepository.findByCode(codeRaw);
        },
      );

      if (existingByCode) {
        errors.push({
          row: rowNumber,
          message: `Group code '${codeRaw}' is already in use`,
        });
        skippedCount++;
        continue;
      }

      const { entity: group } = Group.create({
        name: nameRaw,
        code: codeRaw,
      });

      await container.unitOfWorkProvider.transaction(async (ctx) => {
        await ctx.groupRepository.save(group);
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
