import { Outlet } from "react-router";
import { GlobalHeader } from "@/components/layout/GlobalHeader";

export default function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
