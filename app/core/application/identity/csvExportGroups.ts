import type { ServiceArgs } from "@/core/application/types";
import type { CsvExportGroupsOutput } from "./dto";

export type CsvExportGroupsInput = {
  readonly encoding: "utf-8" | "shift-jis";
};

/**
 * Escape a CSV field value.
 * If the value contains commas, double quotes, or newlines, wrap it in double quotes.
 */
function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export all groups as CSV.
 *
 * CSV columns: code, name
 */
export async function csvExportGroups({
  container,
}: ServiceArgs<CsvExportGroupsInput>): Promise<CsvExportGroupsOutput> {
  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.groupRepository.list({ offset: 0, limit: 100000 });
  });

  const header = ["code", "name"];

  const rows = result.groups.map((group) => {
    return [escapeCsvField(group.code), escapeCsvField(group.name)].join(",");
  });

  const csvContent = [header.join(","), ...rows].join("\n");

  return {
    csvContent,
    fileName: `groups_${formatDateForFileName(new Date())}.csv`,
    totalCount: result.totalCount,
  };
}

function formatDateForFileName(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}
