import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Toaster } from "sonner";
import type { Route } from "./+types/root";
import "./styles/index.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" richColors />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-center">
          <h1 className="mb-sm font-heading text-3xl font-[var(--weight-semibold)] text-neutral-900">
            {error.status}
          </h1>
          <p className="text-base text-neutral-600">
            {error.statusText || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page">
      <div className="text-center">
        <h1 className="mb-sm font-heading text-3xl font-[var(--weight-semibold)] text-neutral-900">
          Error
        </h1>
        <p className="text-base text-neutral-600">{message}</p>
      </div>
    </div>
  );
}
