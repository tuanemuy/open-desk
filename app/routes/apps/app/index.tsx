import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Link } from "react-router";
import type { Route } from "./+types/index";

export { loader } from "./loader";

export function meta({ data }: Route.MetaArgs) {
  const appName = data?.app?.name ?? "App";
  return [{ title: `${appName} - OpenDesk` }];
}

export default function AppDetailPage({ loaderData }: Route.ComponentProps) {
  const { app, records, views, totalCount, currentPage, pageSize } = loaderData;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="mx-auto max-w-[1400px] px-lg px-xl">
      {/* Breadcrumb */}
      <nav>
        <ol className="mb-md flex list-none items-center gap-xs text-sm text-neutral-500">
          <li>
            <Link
              to="/portal"
              className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              Portal
            </Link>
          </li>
          <li className="text-xs text-neutral-400">&gt;</li>
          <li>
            <Link
              to={`/spaces/${app.spaceId}`}
              className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              Space: {app.spaceName}
            </Link>
          </li>
          <li className="text-xs text-neutral-400">&gt;</li>
          <li>App: {app.name}</li>
        </ol>
      </nav>

      {/* App Title Area */}
      <div className="mb-md flex items-center gap-md">
        <h1 className="font-heading text-xl font-[var(--weight-semibold)] tracking-tight text-neutral-900">
          {app.name}
        </h1>
        <button
          type="button"
          className="rounded-sm border-none bg-transparent p-xs text-neutral-400 transition-colors duration-[var(--transition-default)] hover:text-warning"
          title="Add to favorites"
        >
          <Star size={18} />
        </button>
        <button
          type="button"
          className="border-none bg-transparent font-body text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
        >
          Show description
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-md flex flex-wrap items-center gap-sm">
        <select
          className="h-[32px] cursor-pointer appearance-none rounded-sm border border-neutral-300 bg-bg-card pr-[28px] pl-sm font-body text-sm font-[var(--weight-medium)] text-neutral-700 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23666%27%20stroke-width=%272%27%3E%3Cpath%20d=%27M6%209l6%206%206-6%27/%3E%3C/svg%3E')] bg-[position:right_8px_center] bg-no-repeat outline-none transition-[border-color] duration-[var(--transition-default)] hover:border-neutral-400 focus:border-primary"
          aria-label="View switcher"
          defaultValue="1"
        >
          {views.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>

        <select
          className="h-[32px] cursor-pointer appearance-none rounded-sm border border-neutral-300 bg-bg-card pr-[28px] pl-sm font-body text-sm font-[var(--weight-medium)] text-neutral-700 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23666%27%20stroke-width=%272%27%3E%3Cpath%20d=%27M6%209l6%206%206-6%27/%3E%3C/svg%3E')] bg-[position:right_8px_center] bg-no-repeat outline-none transition-[border-color] duration-[var(--transition-default)] hover:border-neutral-400 focus:border-primary"
          aria-label="Filter condition"
          defaultValue=""
        >
          <option value="">--</option>
        </select>

        <button
          type="button"
          className="inline-flex h-[32px] items-center gap-xs rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] leading-tight text-neutral-700 transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100 focus:shadow-[0_0_0_2px_var(--color-primary-lighter)]"
        >
          Filter
        </button>
        <button
          type="button"
          className="inline-flex h-[32px] items-center gap-xs rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] leading-tight text-neutral-700 transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100 focus:shadow-[0_0_0_2px_var(--color-primary-lighter)]"
        >
          Aggregate
        </button>

        <div className="h-5 w-px shrink-0 bg-neutral-200" />

        <Link
          to={`/apps/${app.id}/records/new`}
          className="inline-flex h-[32px] items-center gap-xs rounded-sm border border-primary bg-primary px-md font-body text-sm font-[var(--weight-medium)] leading-tight text-on-primary no-underline transition-all duration-[var(--transition-default)] hover:border-primary-dark hover:bg-primary-dark active:border-primary-darker active:bg-primary-darker"
        >
          Add record
        </Link>

        <div className="ml-auto flex items-center gap-sm">
          <Link
            to={`/apps/${app.id}/settings`}
            className="px-sm py-[6px] text-sm font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
          >
            App settings
          </Link>
          <button
            type="button"
            className="inline-flex h-[32px] items-center gap-xs rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] leading-tight text-neutral-700 transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100 focus:shadow-[0_0_0_2px_var(--color-primary-lighter)]"
          >
            Options
          </button>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-bg-card">
        {/* Table Info */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-md py-sm text-sm text-neutral-600">
          <span>
            {startRecord}-{endRecord} / {totalCount} records
          </span>
          <span className="text-xs text-neutral-400">
            Created at descending
          </span>
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-[120px] border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 select-none">
                Record No.
              </th>
              <th className="w-[220px] border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 select-none">
                Company
              </th>
              <th className="w-[160px] border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 select-none">
                Department
              </th>
              <th className="w-[140px] border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 select-none">
                Contact
              </th>
              <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 select-none">
                Address
              </th>
              <th className="w-[160px] border-b border-neutral-200 bg-bg-section px-md py-sm text-right text-sm font-[var(--weight-medium)] text-neutral-600 select-none" />
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr
                key={record.id}
                className="group transition-colors duration-[var(--transition-fast)] hover:bg-neutral-100"
              >
                <td
                  className={`px-md py-sm align-middle text-sm text-neutral-800 ${index < records.length - 1 ? "border-b border-neutral-200" : ""}`}
                >
                  <Link
                    to={`/apps/${app.id}/records/${record.id}`}
                    className="font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                  >
                    {record.recordNo}
                  </Link>
                </td>
                <td
                  className={`px-md py-sm align-middle text-sm text-neutral-800 ${index < records.length - 1 ? "border-b border-neutral-200" : ""}`}
                >
                  {record.company}
                </td>
                <td
                  className={`px-md py-sm align-middle text-sm text-neutral-800 ${index < records.length - 1 ? "border-b border-neutral-200" : ""}`}
                >
                  {record.department}
                </td>
                <td
                  className={`px-md py-sm align-middle text-sm text-neutral-800 ${index < records.length - 1 ? "border-b border-neutral-200" : ""}`}
                >
                  {record.person}
                </td>
                <td
                  className={`px-md py-sm align-middle text-sm text-neutral-800 ${index < records.length - 1 ? "border-b border-neutral-200" : ""}`}
                >
                  {record.address}
                </td>
                <td
                  className={`px-md py-sm text-right align-middle ${index < records.length - 1 ? "border-b border-neutral-200" : ""}`}
                >
                  <div className="flex items-center justify-end gap-xs whitespace-nowrap opacity-0 transition-opacity duration-[var(--transition-default)] group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-sm border border-neutral-300 bg-bg-card px-sm py-[3px] font-body text-xs font-[var(--weight-medium)] text-neutral-600 transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-sm border border-neutral-300 bg-bg-card px-sm py-[3px] font-body text-xs font-[var(--weight-medium)] text-neutral-600 transition-all duration-[var(--transition-default)] hover:border-error hover:bg-error-light hover:text-error"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-md py-sm">
          <span className="text-sm text-neutral-600">
            {startRecord}-{endRecord} / {totalCount} records
          </span>
          <nav className="flex items-center gap-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-neutral-200 bg-bg-card text-sm font-[var(--weight-medium)] text-neutral-700 transition-all duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-100 focus:shadow-[0_0_0_2px_var(--color-primary-lighter)] focus:outline-none disabled:pointer-events-none disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`flex h-8 w-8 items-center justify-center rounded-sm border text-sm font-[var(--weight-medium)] no-underline transition-all duration-[var(--transition-default)] focus:shadow-[0_0_0_2px_var(--color-primary-lighter)] focus:outline-none ${
                  page === currentPage
                    ? "border-primary bg-primary text-on-primary"
                    : "border-neutral-200 bg-bg-card text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-neutral-200 bg-bg-card text-sm font-[var(--weight-medium)] text-neutral-700 transition-all duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-100 focus:shadow-[0_0_0_2px_var(--color-primary-lighter)] focus:outline-none disabled:pointer-events-none disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
