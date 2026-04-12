/**
 * Returns a Tailwind CSS class name for a progress bar based on the usage ratio.
 */
export function progressLevel(current: number, limit: number): string {
  const ratio = current / limit;
  if (ratio >= 0.8) return "bg-error";
  if (ratio >= 0.5) return "bg-warning";
  return "bg-success";
}

/**
 * Formats a Date object as "YYYY/MM/DD".
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Shared Tailwind CSS classes for admin select elements.
 */
export const SELECT_CLASSES =
  "h-[34px] min-w-[300px] cursor-pointer appearance-none rounded-sm border border-neutral-300 bg-bg-card bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[right_10px_center] bg-no-repeat px-md pr-xl font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]";
