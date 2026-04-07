import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type TimeFormat = "12h" | "24h";

export type SettingsSection = {
  id: string;
  label: string;
};

export type SettingsLoaderData = {
  sections: SettingsSection[];
  activeSection: string;
  timeFormat: TimeFormat;
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "app-settings", label: "各アプリの設定" },
  { id: "time-format", label: "時刻表記" },
  { id: "email-notification", label: "メール通知" },
  { id: "desktop-notification", label: "デスクトップ通知" },
];

export async function loader({
  request,
}: Route.LoaderArgs): Promise<SettingsLoaderData> {
  const auth = await requireAuth(request, container);

  return {
    sections: SETTINGS_SECTIONS,
    activeSection: "time-format",
    timeFormat: (auth.user.timeFormat as TimeFormat) || "24h",
  };
}
