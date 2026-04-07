import { Link } from "react-router";
import type { Route } from "./+types/index";

export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Portal - OpenDesk" }];
}

/* ---------- Icon components ---------- */

function FileIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      <title>File</title>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      <title>People</title>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      <title>Calendar</title>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      <title>Check</title>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      <title>Add</title>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function OptionsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      <title>Options</title>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

const appIcons = {
  file: FileIcon,
  people: PeopleIcon,
  calendar: CalendarIcon,
} as const;

/* ---------- Page component ---------- */

export default function PortalPage({ loaderData }: Route.ComponentProps) {
  const { announcement, notifications, spaces, apps } = loaderData;

  return (
    <div className="mx-auto max-w-[1400px] px-xl">
      {/* Title Bar */}
      <div className="flex items-center justify-between py-lg">
        <h2 className="font-heading text-xl font-[var(--weight-semibold)] tracking-tight text-neutral-900">
          Portal
        </h2>
        <button
          type="button"
          className="inline-flex h-[34px] items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <OptionsIcon />
          Options
        </button>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-[65%_35%] gap-lg pb-2xl">
        {/* Left: Announcements */}
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
          <div className="flex items-center justify-between border-b border-neutral-200 px-lg py-md">
            <h3 className="font-heading text-base font-[var(--weight-semibold)] text-neutral-900">
              Announcements
            </h3>
            <Link
              to="/portal"
              className="text-xs text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              Edit announcement board
            </Link>
          </div>
          <div className="p-lg">
            <div>
              <h4 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-900">
                {announcement.title}
              </h4>

              <p className="mb-md text-base leading-relaxed text-neutral-700">
                OpenDesk is a cloud platform that centralizes your team's
                information and streamlines operations. Follow the steps below
                to create your first app.
              </p>

              <div className="mb-md flex h-[200px] w-full items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 text-sm text-neutral-400">
                App creation steps screenshot
              </div>

              <ol className="mb-md ml-lg list-decimal leading-relaxed text-neutral-700">
                <li className="mb-sm text-base">
                  Select &quot;Create App&quot; from the &quot;Options&quot;
                  button at the top of the screen.
                </li>
                <li className="mb-sm text-base">
                  Choose a template or build a custom app from scratch with
                  &quot;Create from Scratch&quot;.
                </li>
                <li className="mb-sm text-base">
                  Drag and drop fields to configure your form layout.
                </li>
                <li className="mb-sm text-base">
                  Click &quot;Publish&quot; to make the app available to your
                  team members.
                </li>
              </ol>

              <p className="mb-md text-base leading-relaxed text-neutral-700">
                For detailed instructions, visit the{" "}
                <Link
                  to="/search"
                  className="text-primary no-underline hover:underline"
                >
                  Help Center
                </Link>
                . If you have questions, feel free to ask in the{" "}
                <Link
                  to="/spaces/1"
                  className="text-primary no-underline hover:underline"
                >
                  Support Channel
                </Link>
                .
              </p>

              <div className="border-t border-neutral-200 pt-md text-xs text-neutral-500">
                {announcement.date} {announcement.author}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Widgets */}
        <div className="flex flex-col gap-lg">
          {/* Notifications Widget */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
            <div className="flex items-center justify-between border-b border-neutral-200 px-lg py-md">
              <h3 className="font-heading text-base font-[var(--weight-semibold)] text-neutral-900">
                Notifications
              </h3>
              <div className="flex items-center gap-sm">
                <select
                  className="h-7 cursor-pointer appearance-none rounded-sm border border-neutral-200 bg-neutral-50 px-sm pr-7 font-body text-xs font-[var(--weight-medium)] text-neutral-700 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23777%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E')] bg-[position:right_8px_center] bg-no-repeat transition-[border-color] duration-[var(--transition-default)] hover:border-neutral-300"
                  aria-label="Filter notifications"
                >
                  <option>All</option>
                  <option defaultValue="selected">For me</option>
                  <option>Read later</option>
                </select>
                <div className="flex overflow-hidden rounded-sm border border-neutral-200">
                  <button
                    type="button"
                    className="h-[26px] border-none bg-primary-lighter px-sm font-body text-xs font-[var(--weight-medium)] text-primary-dark transition-[color,background-color] duration-[var(--transition-default)]"
                  >
                    Unread
                  </button>
                  <button
                    type="button"
                    className="h-[26px] border-l border-neutral-200 bg-bg-card px-sm font-body text-xs font-[var(--weight-medium)] text-neutral-500 transition-[color,background-color] duration-[var(--transition-default)] hover:bg-neutral-50 hover:text-neutral-700"
                  >
                    Read
                  </button>
                </div>
              </div>
            </div>
            <ul className="list-none">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`flex items-start gap-sm border-b border-neutral-100 px-lg py-md transition-colors duration-[var(--transition-default)] last:border-b-0 ${
                    notif.unread ? "bg-primary-lighter" : "hover:bg-neutral-50"
                  }`}
                >
                  <button
                    type="button"
                    title="Mark as read"
                    aria-label="Mark as read"
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-none bg-transparent text-neutral-400 transition-[color,background-color] duration-[var(--transition-default)] hover:bg-primary-lighter hover:text-primary"
                  >
                    <CheckCircleIcon />
                  </button>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/notifications"
                      className="text-neutral-800 no-underline hover:underline"
                    >
                      <div className="text-sm leading-normal text-neutral-700">
                        {notif.unread ? (
                          <span className="mr-xs inline-block h-[7px] w-[7px] rounded-full bg-primary align-middle" />
                        ) : null}
                        <span className="font-[var(--weight-medium)] text-neutral-800">
                          {notif.appName}
                        </span>{" "}
                        - {notif.message}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {notif.timeAgo} &middot; {notif.author}
                      </div>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Spaces Widget */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
            <div className="flex items-center justify-between border-b border-neutral-200 px-lg py-md">
              <h3 className="font-heading text-base font-[var(--weight-semibold)] text-neutral-900">
                Spaces
              </h3>
              <div className="flex items-center gap-sm">
                <select
                  className="h-7 cursor-pointer appearance-none rounded-sm border border-neutral-200 bg-neutral-50 px-sm pr-7 font-body text-xs font-[var(--weight-medium)] text-neutral-700 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23777%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E')] bg-[position:right_8px_center] bg-no-repeat transition-[border-color] duration-[var(--transition-default)] hover:border-neutral-300"
                  aria-label="Filter spaces"
                >
                  <option defaultValue="selected">Joined spaces</option>
                  <option>Favorite spaces</option>
                  <option>Recently opened</option>
                  <option>Created by me</option>
                  <option>All spaces</option>
                </select>
              </div>
            </div>
            <ul className="list-none">
              {spaces.map((space) => (
                <li
                  key={space.id}
                  className="flex items-center gap-md border-b border-neutral-100 px-lg py-md transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-50"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-[var(--weight-medium)] text-on-primary"
                    style={{ background: space.color }}
                  >
                    {space.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/spaces/${space.id}`}
                      className="text-sm font-[var(--weight-medium)] text-neutral-800 no-underline hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {space.name}
                    </Link>
                    <div className="mt-px truncate text-xs text-neutral-500">
                      {space.description}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-neutral-200 px-lg py-sm">
              <button
                type="button"
                className="inline-flex items-center gap-xs rounded-sm border-none bg-transparent px-sm py-xs font-body text-xs font-[var(--weight-medium)] text-primary transition-[background-color,color] duration-[var(--transition-default)] hover:bg-primary-lighter hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <PlusIcon />
                Create space
              </button>
            </div>
          </div>

          {/* Apps Widget */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
            <div className="flex items-center justify-between border-b border-neutral-200 px-lg py-md">
              <h3 className="font-heading text-base font-[var(--weight-semibold)] text-neutral-900">
                Apps
              </h3>
              <div className="flex items-center gap-sm">
                <select
                  className="h-7 cursor-pointer appearance-none rounded-sm border border-neutral-200 bg-neutral-50 px-sm pr-7 font-body text-xs font-[var(--weight-medium)] text-neutral-700 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23777%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E')] bg-[position:right_8px_center] bg-no-repeat transition-[border-color] duration-[var(--transition-default)] hover:border-neutral-300"
                  aria-label="Filter apps"
                >
                  <option defaultValue="selected">All apps</option>
                  <option>Favorite apps</option>
                  <option>Recently opened</option>
                  <option>Created by me</option>
                  <option>Recently published</option>
                </select>
              </div>
            </div>
            <ul className="list-none">
              {apps.map((app) => {
                const IconComponent = appIcons[app.icon];
                return (
                  <li
                    key={app.id}
                    className="flex items-center gap-md border-b border-neutral-100 px-lg py-md transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-150 text-sm text-neutral-600">
                      <IconComponent />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/apps/${app.id}`}
                        className="text-sm font-[var(--weight-medium)] text-neutral-800 no-underline hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {app.name}
                      </Link>
                      <div className="mt-px text-xs text-neutral-500">
                        {app.spaceName}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-neutral-200 px-lg py-sm">
              <button
                type="button"
                className="inline-flex items-center gap-xs rounded-sm border-none bg-transparent px-sm py-xs font-body text-xs font-[var(--weight-medium)] text-primary transition-[background-color,color] duration-[var(--transition-default)] hover:bg-primary-lighter hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <PlusIcon />
                Create app
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
