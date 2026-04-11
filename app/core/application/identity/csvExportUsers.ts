import type { ServiceArgs } from "@/core/application/types";
import type { CsvExportUsersOutput } from "./dto";

export type CsvExportUsersInput = {
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
 * Export all users as CSV.
 *
 * CSV columns: loginName, displayName, email, timezone, language, isActive
 */
export async function csvExportUsers({
  container,
}: ServiceArgs<CsvExportUsersInput>): Promise<CsvExportUsersOutput> {
  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.userRepository.list({ offset: 0, limit: 100000 });
  });

  const header = [
    "loginName",
    "displayName",
    "email",
    "timezone",
    "language",
    "isActive",
  ];

  const rows = result.users.map((user) => {
    return [
      escapeCsvField(user.loginName),
      escapeCsvField(user.displayName),
      escapeCsvField(user.email),
      escapeCsvField(user.timezone),
      escapeCsvField(user.language),
      user.isActive ? "true" : "false",
    ].join(",");
  });

  const csvContent = [header.join(","), ...rows].join("\n");

  return {
    csvContent,
    fileName: `users_${formatDateForFileName(new Date())}.csv`,
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
