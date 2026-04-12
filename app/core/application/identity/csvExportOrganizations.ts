import type { ServiceArgs } from "@/core/application/types";
import type { CsvExportOrganizationsOutput } from "./dto";

export type CsvExportOrganizationsInput = {
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
 * Export all organizations as CSV.
 *
 * CSV columns: code, name, parentCode
 *
 * parentCode is resolved from parentOrganizationId by looking up
 * the parent organization's code.
 */
export async function csvExportOrganizations({
  container,
}: ServiceArgs<CsvExportOrganizationsInput>): Promise<CsvExportOrganizationsOutput> {
  const organizations = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.organizationRepository.findAll();
    },
  );

  const idToCode = new Map<string, string>();
  for (const org of organizations) {
    idToCode.set(org.organizationId, org.code);
  }

  const header = ["code", "name", "parentCode"];

  const rows = organizations.map((org) => {
    const parentCode =
      org.parentOrganizationId !== null
        ? (idToCode.get(org.parentOrganizationId) ?? "")
        : "";
    return [
      escapeCsvField(org.code),
      escapeCsvField(org.name),
      escapeCsvField(parentCode),
    ].join(",");
  });

  const csvContent = [header.join(","), ...rows].join("\n");

  return {
    csvContent,
    fileName: `organizations_${formatDateForFileName(new Date())}.csv`,
    totalCount: organizations.length,
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
