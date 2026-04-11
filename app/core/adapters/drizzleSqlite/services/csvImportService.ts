import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import {
  CsvImportJob,
  Record as RecordEntity,
} from "@/core/domain/record/entity";
import type { CsvImportService } from "@/core/domain/record/services/csvImportService";
import type {
  FieldCode,
  FieldMapping,
  FieldValue,
} from "@/core/domain/record/valueObject";
import { CsvImportJobStatus } from "@/core/domain/record/valueObject";
import type { Database } from "../client";
import { records } from "../schema";

/**
 * Map the domain CsvDelimiter enum value to the actual delimiter character.
 */
function resolveDelimiter(delimiter: string): string {
  switch (delimiter) {
    case "COMMA":
      return ",";
    case "SEMICOLON":
      return ";";
    case "TAB":
      return "\t";
    case "SPACE":
      return " ";
    default:
      return ",";
  }
}

/**
 * Decode an ArrayBuffer to a string using the specified encoding.
 */
function decodeContent(buffer: ArrayBuffer, encoding: string): string {
  const encodingMap: Record<string, string> = {
    UTF8: "utf-8",
    UTF8_BOM: "utf-8",
    SHIFT_JIS: "shift_jis",
    LATIN1: "iso-8859-1",
    GBK: "gbk",
  };
  const label = encodingMap[encoding] ?? "utf-8";
  const decoder = new TextDecoder(label);
  return decoder.decode(buffer);
}

/**
 * Convert a raw CSV cell value into a FieldValue for a given mapping.
 * Uses SINGLE_LINE_TEXT as the default type since the CSV import produces
 * text values; the validation service will handle type-specific checks later.
 */
function cellToFieldValue(
  rawValue: string,
  _mapping: FieldMapping,
): FieldValue {
  return {
    type: "SINGLE_LINE_TEXT",
    value: rawValue,
  };
}

/**
 * Build a map of field values from a parsed CSV row using the job's field mappings.
 */
function buildFieldValues(
  row: Record<string, string>,
  fieldMappings: readonly FieldMapping[],
): ReadonlyMap<FieldCode, FieldValue> {
  const values = new Map<FieldCode, FieldValue>();
  for (const mapping of fieldMappings) {
    const rawValue = row[mapping.fileColumn];
    if (rawValue !== undefined) {
      values.set(mapping.appFieldCode, cellToFieldValue(rawValue, mapping));
    }
  }
  return values;
}

/**
 * Convert a ReadonlyMap<FieldCode, FieldValue> to a JSON-serializable plain object.
 */
function fieldValuesToJson(
  fieldValues: ReadonlyMap<FieldCode, FieldValue>,
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of fieldValues) {
    obj[key as string] = value;
  }
  return obj;
}

/**
 * Drizzle SQLite implementation of CsvImportService.
 *
 * Parses CSV file content and creates/updates records based on the import job definition.
 */
export class DrizzleSqliteCsvImportService implements CsvImportService {
  constructor(private readonly db: Database) {}

  async processImport(
    job: CsvImportJob,
    fileContent: ArrayBuffer,
  ): Promise<CsvImportJob> {
    const csvText = decodeContent(fileContent, job.encoding);
    const delimiterChar = resolveDelimiter(job.delimiter);

    const parseResult = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      delimiter: delimiterChar,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return CsvImportJob.fail(job, "Failed to parse CSV file");
    }

    const rows = parseResult.data;
    let currentJob = job;
    let processedCount = 0;
    let errorCount = 0;

    if (job.importMode === "UPSERT") {
      const result = await this.processUpsert(currentJob, rows);
      currentJob = result.job;
      processedCount = result.processedCount;
      errorCount = result.errorCount;
    } else {
      const result = await this.processAddOnly(currentJob, rows);
      currentJob = result.job;
      processedCount = result.processedCount;
      errorCount = result.errorCount;
    }

    if (currentJob.status === CsvImportJobStatus.Failed) {
      return currentJob;
    }

    return CsvImportJob.complete(currentJob, processedCount, errorCount);
  }

  /**
   * Process rows in ADD_ONLY mode: create a new record for every row.
   */
  private async processAddOnly(
    job: CsvImportJob,
    rows: Record<string, string>[],
  ): Promise<{
    job: CsvImportJob;
    processedCount: number;
    errorCount: number;
  }> {
    let currentJob = job;
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // 1-based, row 1 is header

      try {
        const fieldValues = buildFieldValues(row, job.fieldMappings);
        const { entity: newRecord } = RecordEntity.create({
          appId: job.appId,
          creatorId: job.creatorId,
        });
        const { entity: recordWithFields } = RecordEntity.updateFieldValues(
          newRecord,
          fieldValues,
          false,
        );
        await this.saveRecord(recordWithFields);
        processedCount++;
      } catch (error) {
        errorCount++;
        const message =
          error instanceof Error ? error.message : "Unknown error";
        currentJob = CsvImportJob.recordError(
          currentJob,
          rowNumber,
          job.fieldMappings[0]?.appFieldCode ?? ("" as FieldCode),
          message,
        );

        if (currentJob.status === CsvImportJobStatus.Failed) {
          return { job: currentJob, processedCount, errorCount };
        }
      }
    }

    return { job: currentJob, processedCount, errorCount };
  }

  /**
   * Process rows in UPSERT mode: find existing records by updateKey
   * and update them, or create new records if no match is found.
   */
  private async processUpsert(
    job: CsvImportJob,
    rows: Record<string, string>[],
  ): Promise<{
    job: CsvImportJob;
    processedCount: number;
    errorCount: number;
  }> {
    let currentJob = job;
    let processedCount = 0;
    let errorCount = 0;

    const updateKey = job.updateKey;
    if (updateKey === null) {
      return {
        job: CsvImportJob.fail(job, "Update key is required for UPSERT mode"),
        processedCount: 0,
        errorCount: 0,
      };
    }

    // Find the field mapping for the update key to determine the CSV column
    const updateKeyMapping = job.fieldMappings.find(
      (m) => m.appFieldCode === updateKey,
    );
    if (!updateKeyMapping) {
      return {
        job: CsvImportJob.fail(
          job,
          "Update key field is not mapped to a CSV column",
        ),
        processedCount: 0,
        errorCount: 0,
      };
    }

    // Load all existing records for this app to match by update key
    const existingRecords = await this.loadExistingRecords(job.appId);
    const recordByKeyValue = new Map<string, RecordEntity>();
    for (const rec of existingRecords) {
      const fieldValue = rec.fieldValues.get(updateKey);
      if (fieldValue) {
        const keyStr = extractStringFromFieldValue(fieldValue);
        if (keyStr !== null) {
          recordByKeyValue.set(keyStr, rec);
        }
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const fieldValues = buildFieldValues(row, job.fieldMappings);
        const csvKeyValue = row[updateKeyMapping.fileColumn] ?? "";

        const existingRecord = recordByKeyValue.get(csvKeyValue);

        if (existingRecord) {
          // Update existing record
          const { entity: updatedRecord } = RecordEntity.updateFieldValues(
            existingRecord,
            fieldValues,
            true,
          );
          const incrementedRecord =
            RecordEntity.incrementRevision(updatedRecord);
          const modifiedRecord = RecordEntity.setModifier(
            incrementedRecord,
            job.creatorId,
          );
          await this.saveRecord(modifiedRecord);
        } else {
          // Create new record
          const { entity: newRecord } = RecordEntity.create({
            appId: job.appId,
            creatorId: job.creatorId,
          });
          const { entity: recordWithFields } = RecordEntity.updateFieldValues(
            newRecord,
            fieldValues,
            false,
          );
          await this.saveRecord(recordWithFields);
        }
        processedCount++;
      } catch (error) {
        errorCount++;
        const message =
          error instanceof Error ? error.message : "Unknown error";
        currentJob = CsvImportJob.recordError(
          currentJob,
          rowNumber,
          updateKey,
          message,
        );

        if (currentJob.status === CsvImportJobStatus.Failed) {
          return { job: currentJob, processedCount, errorCount };
        }
      }
    }

    return { job: currentJob, processedCount, errorCount };
  }

  /**
   * Save a single record to the database (insert or update via upsert).
   */
  private async saveRecord(record: RecordEntity): Promise<void> {
    try {
      const values = {
        id: record.recordId as string,
        appId: record.appId as string,
        revision: record.revision,
        fieldValues: fieldValuesToJson(record.fieldValues),
        status: (record.status as string) ?? null,
        statusAssignees: [...record.statusAssignees] as unknown as string[],
        creatorId: record.creatorId as string,
        modifierId: record.modifierId as string,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };

      await this.db
        .insert(records)
        .values(values)
        .onConflictDoUpdate({
          target: records.id,
          set: {
            revision: values.revision,
            fieldValues: values.fieldValues,
            status: values.status,
            statusAssignees: values.statusAssignees,
            modifierId: values.modifierId,
            updatedAt: values.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save record during CSV import",
        error,
      );
    }
  }

  /**
   * Load all existing records for an app from the database.
   * Used in UPSERT mode to match records by update key.
   */
  private async loadExistingRecords(
    appId: AppId,
  ): Promise<readonly RecordEntity[]> {
    try {
      const rows = await this.db
        .select()
        .from(records)
        .where(eq(records.appId, appId as string));

      return rows.map((row) => {
        const fieldValues = new Map<FieldCode, FieldValue>();
        if (row.fieldValues && typeof row.fieldValues === "object") {
          for (const [key, value] of Object.entries(
            row.fieldValues as Record<string, unknown>,
          )) {
            fieldValues.set(key as FieldCode, value as FieldValue);
          }
        }

        return RecordEntity.reconstruct({
          recordId: row.id as RecordEntity["recordId"],
          appId: row.appId as AppId,
          revision: row.revision,
          fieldValues,
          status: (row.status as RecordEntity["status"]) ?? null,
          statusAssignees: (row.statusAssignees as unknown as string[]).map(
            (id) => id as UserId,
          ),
          creatorId: row.creatorId as UserId,
          createdAt: row.createdAt,
          modifierId: row.modifierId as UserId,
          updatedAt: row.updatedAt,
        });
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to load existing records for CSV import",
        error,
      );
    }
  }
}

/**
 * Extract a string representation from a FieldValue for key comparison.
 */
function extractStringFromFieldValue(fieldValue: FieldValue): string | null {
  switch (fieldValue.type) {
    case "SINGLE_LINE_TEXT":
    case "NUMBER":
    case "LINK":
    case "RECORD_NUMBER":
    case "RADIO_BUTTON":
    case "DROP_DOWN":
      return fieldValue.value;
    case "DATE":
    case "TIME":
    case "DATETIME":
      return fieldValue.value;
    default:
      return null;
  }
}
