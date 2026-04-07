import { Outlet } from "react-router";
import { GlobalHeader } from "./GlobalHeader";

type AppLayoutProps = {
  displayName?: string;
};

export function AppLayout({ displayName }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader displayName={displayName} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
