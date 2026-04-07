import { progressLevel } from "@/lib/admin";

export type LicenseInfo = {
  label: string;
  current: number;
  limit: number | null;
};

export function LicenseCard({ license }: { license: LicenseInfo }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-bg-card p-lg">
      <div className="mb-sm text-sm font-[var(--weight-medium)] text-neutral-600">
        {license.label}
      </div>
      <div className="mb-md flex items-baseline gap-sm">
        <span className="font-heading text-3xl font-[var(--weight-semibold)] leading-tight text-neutral-900">
          {license.current.toLocaleString()}
        </span>
        {license.limit !== null && (
          <span className="text-base text-neutral-500">
            / {license.limit.toLocaleString()}
          </span>
        )}
      </div>
      {license.limit !== null ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className={`h-full rounded-full transition-[width] duration-[var(--transition-slow)] ${progressLevel(license.current, license.limit)}`}
            style={{
              width: `${Math.min((license.current / license.limit) * 100, 100)}%`,
            }}
          />
        </div>
      ) : (
        <div className="invisible h-1.5" />
      )}
    </div>
  );
}
