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

export async function loader(
  _args: Route.LoaderArgs,
): Promise<SettingsLoaderData> {
  const sections: SettingsSection[] = [
    { id: "app-settings", label: "各アプリの設定" },
    { id: "time-format", label: "時刻表記" },
    { id: "email-notification", label: "メール通知" },
    { id: "desktop-notification", label: "デスクトップ通知" },
  ];

  return {
    sections,
    activeSection: "time-format",
    timeFormat: "24h",
  };
}
