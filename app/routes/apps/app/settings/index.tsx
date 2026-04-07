import { Settings } from "lucide-react";
import { Link } from "react-router";
import type { Route } from "./+types/index";

export { loader } from "./loader";

export function meta({ data }: Route.MetaArgs) {
  const appName = data?.app?.name ?? "App";
  return [{ title: `Settings - ${appName} - OpenDesk` }];
}

export default function AppSettingsPage({ loaderData }: Route.ComponentProps) {
  const { app, tabs, activeTab, fieldRows, paletteChips } = loaderData;

  return (
    <div className="mx-auto max-w-[1400px] px-xl py-lg pb-3xl">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="mb-md flex list-none items-center gap-xs text-sm text-neutral-500">
          <li>
            <Link
              to="/portal"
              className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              Portal
            </Link>
          </li>
          <li className="text-xs text-neutral-400">/</li>
          <li>
            <Link
              to={`/spaces/${app.spaceId}`}
              className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              {app.spaceName}
            </Link>
          </li>
          <li className="text-xs text-neutral-400">/</li>
          <li>
            <Link
              to={`/apps/${app.id}`}
              className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              {app.name}
            </Link>
          </li>
          <li className="text-xs text-neutral-400">/</li>
          <li className="font-[var(--weight-medium)] text-neutral-700">
            App Settings
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="mb-lg">
        <h1 className="font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
          {app.name}
          <small className="ml-sm text-base font-[var(--weight-normal)] text-neutral-500">
            App Settings
          </small>
        </h1>
      </div>

      {/* Tab Bar */}
      <div className="-mb-px mb-lg flex border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`-mb-px flex items-center border-b-2 px-lg py-sm text-sm font-[var(--weight-medium)] no-underline transition-[color,border-color] duration-[var(--transition-default)] ${
              tab.id === activeTab
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="mb-lg flex items-center gap-sm">
        <button
          type="button"
          className="flex h-[36px] items-center rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-dark active:bg-primary-darker"
        >
          Save form
        </button>
        <button
          type="button"
          className="flex h-[36px] items-center rounded-md border border-neutral-300 bg-bg-card px-lg font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-50"
        >
          Update app
        </button>
      </div>

      {/* Form Builder Layout */}
      <div className="flex items-start gap-lg">
        {/* Left: Field Palette */}
        <aside className="w-[250px] shrink-0">
          <div className="rounded-lg border border-neutral-200 bg-bg-card p-md">
            <div className="mb-md border-b border-neutral-200 pb-sm text-sm font-[var(--weight-semibold)] text-neutral-700">
              Fields
            </div>
            <div className="flex flex-wrap gap-xs">
              {paletteChips.map((chip) => (
                <span
                  key={chip.label}
                  className={`inline-flex h-7 cursor-grab items-center rounded-sm border px-sm text-xs font-[var(--weight-medium)] transition-[background-color,border-color,box-shadow] duration-[var(--transition-default)] select-none active:cursor-grabbing active:shadow-md ${
                    chip.system
                      ? "border-dashed border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-600"
                      : "border-neutral-200 bg-neutral-100 text-neutral-700 hover:border-primary-light hover:bg-primary-lighter hover:text-primary-dark"
                  }`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Main: Form Canvas */}
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-neutral-200 bg-bg-card p-lg">
            <div className="mb-lg border-b border-neutral-200 pb-sm text-sm font-[var(--weight-semibold)] text-neutral-700">
              Form Layout
            </div>

            <div className="flex flex-col gap-sm">
              {fieldRows.map((row) => (
                <div key={row.id} className="flex gap-sm">
                  {row.fields.map((field) => (
                    <div
                      key={field.id}
                      className="group min-w-0 cursor-pointer rounded-md border border-neutral-200 bg-bg-card px-md py-sm transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-primary-light hover:shadow-sm"
                      style={{ flex: field.flex ?? 1 }}
                    >
                      <div className="flex items-center justify-between gap-sm">
                        <div className="flex min-w-0 flex-col gap-[2px]">
                          <div className="truncate text-sm font-[var(--weight-medium)] text-neutral-800">
                            {field.name}
                            {field.required && (
                              <span className="ml-xs text-xs font-[var(--weight-medium)] text-error">
                                *
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {field.type}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-xs">
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-sm border-none bg-transparent text-neutral-400 transition-[color,background-color] duration-[var(--transition-default)] hover:bg-neutral-100 hover:text-neutral-700"
                            title="Settings"
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
